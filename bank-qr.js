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

    /**
     * 
     * @param {String} bankBin String Bank Identification Number)
     * @param {String} accNo String Merchant ID
     * @param {String} initType String STATIC is static qr, DYNAMIC dynamic qr
     * @param {Boolean} isAccount Boolean true is account number, false card number
     * @param {String} amount String if initType DYNAMIC amount > 0, else ignore
     * @param {String} desc String description if initType DYNAMIC desc length 0-99, A-Z, a-z, 1-9, else ignore
     */
    constructor(bankBin, accNo, initType, isAccount, amount, desc) {
        this.bankBin = bankBin;
        this.accNo = accNo;
        this.initType = initType?.toUpperCase() || "STATIC";
        this.isAccount = isAccount;
        this.amount = amount;
        this.desc = desc;
        this.billNumber = this.#generateBillNumber();
    }

    /**
     * Generates a random bill number
     * @returns {String} Random bill number
     */
    #generateBillNumber() {
        return QRGeneration.#CONSTANTS.BILL_PREFIX + randomInt(10000).toString().padStart(4, '0');
    }

    /**
     * Formats the length of the data
     * @param {*} data 
     * @returns {String} Formatted length
     */
    #formatLength(data) {
        const length = data.toString().length;
        if (length < 1 || length > 99) {
            throw new Error(`Data length ${length} out of range (1-99)`);
        }
        return length.toString().padStart(2, '0');
    }

    /**
     * Builds a TLV (Tag-Length-Value) string
     * @param {String} id 
     * @param {String} value 
     * @returns {String} TLV string
     */
    #buildTLV(id, value) {
        return id + this.#formatLength(value) + value;
    }

    /**
     * Calculates the CRC16 checksum for the given data
     * @param {*} data 
     * @returns {String} CRC16 checksum
     */
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

    /**
     * Gets the point of initiation for the QR code
     * @returns {String} Point of initiation
     */
    #getPointOfInitiation() {
        return this.initType === "STATIC"
            ? QRGeneration.#CONSTANTS.PIM_STATIC
            : QRGeneration.#CONSTANTS.PIM_DYNAMIC;
    }

    /**
     * Gets the merchant information for the QR code
     * @returns {String} Merchant information
     */
    #getMerchantInfo() {
        const acquirerData = QRGeneration.#CONSTANTS.ACQUIRER_ID + this.bankBin;
        const merchantData = this.#buildTLV(QRGeneration.#CONSTANTS.MERCHANT_ID, this.accNo);

        return acquirerData + merchantData;
    }

    /**
     * Determines the service type based on whether it's an account or card
     * @returns {String} Service type
     */
    #getServiceType() {
        return this.isAccount
            ? QRGeneration.#CONSTANTS.SERVICE_ACCOUNT
            : QRGeneration.#CONSTANTS.SERVICE_CARD;
    }

    /**
     * Gets the merchant account information for the QR code
     * @returns {String} Merchant account information
     */
    #getMerchantAccountInfo() {
        const merchantInfo = this.#getMerchantInfo();
        const fullData = QRGeneration.#CONSTANTS.GUID +
            QRGeneration.#CONSTANTS.BENEFICIARY_ORG_ID +
            this.#formatLength(merchantInfo) +
            merchantInfo +
            this.#getServiceType();

        return this.#buildTLV(QRGeneration.#CONSTANTS.DVCNTT_ID, fullData);
    }

    /**
     * Gets the transaction amount for the QR code
     * @returns {String} Transaction amount
     */
    #getTransactionAmount() {
        return this.initType === "DYNAMIC" && this.amount
            ? this.#buildTLV(QRGeneration.#CONSTANTS.AMOUNT_ID, this.amount)
            : "";
    }

    /**
     * Gets the additional data for the QR code
     * @returns {String} Additional data
     */
    #getAdditionalData() {
        if (this.initType !== "DYNAMIC") return "";

        const billData = this.#buildTLV(QRGeneration.#CONSTANTS.BILL_NUMBER_ID, this.billNumber);
        const purposeData = this.#buildTLV(QRGeneration.#CONSTANTS.PURPOSE_ID, this.desc);

        return this.#buildTLV(QRGeneration.#CONSTANTS.ADDITIONAL_DATA_ID, billData + purposeData);
    }

    /**
     * Generates the QR code string
     * @returns {String} QR code string
     */
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

    /**
     * Gets the components of the QR code
     * @returns {Object} QR code components
     */
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

//Usage example
const qrGenerator = new QRGeneration("970407", "2543663452");


console.log("QR String:", qrGenerator.generateQR());
console.log("Components:", qrGenerator.getComponents());
