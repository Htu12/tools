'use strict';

const { randomInt } = require('crypto');
class QRGeneration {
  // EMV QR Code Constants
  static #CONSTANTS = {
    PAYLOAD_FORMAT: "000201",
    PIM_STATIC: "010211",
    PIM_DYNAMIC: "010212",
    CURRENCY: "5303704",
    COUNTRY: "5802VN",
    CRC_ID: "6304",
    ACQUIRER_ID: "0006",
    MERCHANT_ID: "01",
    BENEFICIARY_ORG_ID: "01",
    DVCNTT_ID: "38",
    AMOUNT_ID: "54",
    ADDITIONAL_DATA_ID: "62",
    BILL_NUMBER_ID: "01",
    PURPOSE_ID: "08",
    GUID: "0010A000000727",
    SERVICE_ACCOUNT: "0208QRIBFTTA",
    SERVICE_CARD: "0208QRIBFTTC",
    BILL_PREFIX: "NAPAS"
  };

  constructor(bankBin, accNo, initType, isAccount, amount) {
    this.bankBin = bankBin;
    this.accNo = accNo;
    this.initType = initType?.toUpperCase() || "STATIC";
    this.isAccount = isAccount;
    this.amount = amount;
    this.billNumber = this.#generateBillNumber();
  }

  #generateBillNumber() {
    return QRGeneration.#CONSTANTS.BILL_PREFIX + randomInt(10000).toString().padStart(4, '0');
  }

  #formatLength(data) {
    const length = data.toString().length;
    if (length < 1 || length > 99) {
      throw new Error(`Data length ${length} out of range (1-99)`);
    }
    return length.toString().padStart(2, '0');
  }

  #buildTLV(id, value) {
    return id + this.#formatLength(value) + value;
  }

  #calculateCRC16(data) {
    const polynomial = 0x1021;
    let crc = 0xFFFF;

    for (const char of data) {
      crc ^= (char.charCodeAt(0) << 8);
      
      for (let i = 0; i < 8; i++) {
        crc = (crc & 0x8000) ? ((crc << 1) ^ polynomial) : (crc << 1);
        crc &= 0xFFFF;
      }
    }

    return crc.toString(16).toUpperCase().padStart(4, '0');
  }

  #getPointOfInitiation() {
    return this.initType === "STATIC" 
      ? QRGeneration.#CONSTANTS.PIM_STATIC 
      : QRGeneration.#CONSTANTS.PIM_DYNAMIC;
  }

  #getMerchantInfo() {
    const acquirerData = QRGeneration.#CONSTANTS.ACQUIRER_ID + this.bankBin;
    const merchantData = this.#buildTLV(QRGeneration.#CONSTANTS.MERCHANT_ID, this.accNo);
    
    return acquirerData + merchantData;
  }

  #getServiceType() {
    return this.isAccount 
      ? QRGeneration.#CONSTANTS.SERVICE_ACCOUNT 
      : QRGeneration.#CONSTANTS.SERVICE_CARD;
  }

  #getMerchantAccountInfo() {
    const merchantInfo = this.#getMerchantInfo();
    const fullData = QRGeneration.#CONSTANTS.GUID + 
                    QRGeneration.#CONSTANTS.BENEFICIARY_ORG_ID +
                    this.#formatLength(merchantInfo) + 
                    merchantInfo + 
                    this.#getServiceType();
    
    return this.#buildTLV(QRGeneration.#CONSTANTS.DVCNTT_ID, fullData);
  }

  #getTransactionAmount() {
    return this.initType === "DYNAMIC" && this.amount 
      ? this.#buildTLV(QRGeneration.#CONSTANTS.AMOUNT_ID, this.amount)
      : "";
  }

  #getAdditionalData() {
    if (this.initType !== "DYNAMIC") return "";

    const billData = this.#buildTLV(QRGeneration.#CONSTANTS.BILL_NUMBER_ID, this.billNumber);
    const purposeData = this.#buildTLV(QRGeneration.#CONSTANTS.PURPOSE_ID, "Thank you");
    
    return this.#buildTLV(QRGeneration.#CONSTANTS.ADDITIONAL_DATA_ID, billData + purposeData);
  }

  generateQR() {
    const qrData = QRGeneration.#CONSTANTS.PAYLOAD_FORMAT +
                   this.#getPointOfInitiation() +
                   this.#getMerchantAccountInfo() +
                   QRGeneration.#CONSTANTS.CURRENCY +
                   this.#getTransactionAmount() +
                   QRGeneration.#CONSTANTS.COUNTRY +
                   this.#getAdditionalData() +
                   QRGeneration.#CONSTANTS.CRC_ID;

    const crc = this.#calculateCRC16(qrData);
    return qrData + crc;
  }

  // Debug methods
  getComponents() {
    return {
      payloadFormat: QRGeneration.#CONSTANTS.PAYLOAD_FORMAT,
      pointOfInitiation: this.#getPointOfInitiation(),
      merchantAccount: this.#getMerchantAccountInfo(),
      currency: QRGeneration.#CONSTANTS.CURRENCY,
      amount: this.#getTransactionAmount(),
      country: QRGeneration.#CONSTANTS.COUNTRY,
      additionalData: this.#getAdditionalData(),
      billNumber: this.billNumber
    };
  }
}


// Usage example
const qrGenerator = new QRGeneration("970415", "100609903929", "DYNAMIC", true, "200000");

// console.log("QR String:", qrGenerator.generateQR());
// console.log("Components:", qrGenerator.getComponents());

module.exports = { QRGeneration };