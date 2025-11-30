(function () {
  console.clear();

  // 1. Tìm nút "Xem toàn văn" để lấy Hash và ID
  var regex = /xemtoanvan\('(https:[^']+\/hash\/[a-f0-9]+)'/;
  var htmlContent = document.body.innerHTML;
  var match = htmlContent.match(regex);

  if (!match) {
    console.error(
      "[ERROR] Không tìm thấy link 'Xem toàn văn'. Cấu trúc web có thể đã đổi."
    );
    return;
  }

  var fullLink = match[1];

  console.log("[DEBUG] LINK GỐC: " + fullLink);

  // 2. Trích xuất ID và Hash từ link
  var idMatch = fullLink.match(/\/id\/(\d+)/);
  var hashMatch = fullLink.match(/\/hash\/([a-f0-9]+)/);

  if (!idMatch || !hashMatch) {
    console.error(
      "[ERROR] Không thể trích xuất ID hoặc Hash từ link. Cấu trúc link có thể đã đổi."
    );
    return;
  }

  var docId = idMatch[1];
  var docHash = hashMatch[1];
  var timestamp = Math.floor(Date.now() / 1000);

  console.log(`[DEBUG] ID: ${docId} | Hash: ${docHash}`);

  // 3. Gọi API để lấy dữ liệu
  var apiUrl = `https://thuvienso.apd.edu.vn/doc/loadpdf2?id=${docId}&t1=${timestamp}&hash=${docHash}&t1=${timestamp}`;

  console.log("[DEBUG] API URL: ", apiUrl);

  fetch(apiUrl, {
    headers: { APP_KEY: docHash },
  })
    .then((response) => {
      if (!response.ok) throw new Error("Lỗi kết nối: " + response.status);
      return response.text();
    })
    .then((dirtyData) => {
      // 4. Lọc mã rác (#excRCQWQP...b)
      var cleanData = dirtyData.replace(/#excRCQWQP.*?b/g, "");

      if (dirtyData.length === cleanData.length) {
        console.warn(
          "Không thấy mã rác. Có thể file tải về sẽ lỗi hoặc web đã đổi thuật toán."
        );
      } else {
        console.log("[INFO] ĐÃ XÓA MÃ RÁC!");
      }

      // 5. Chuyển đổi sang PDF và tải về
      var byteCharacters = atob(cleanData);
      var byteNumbers = new Array(byteCharacters.length);
      for (var i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      var byteArray = new Uint8Array(byteNumbers);
      var blob = new Blob([byteArray], { type: "application/pdf" });
      var link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `Doc_${docId}.pdf`;
      link.click();

      console.log("[INFO] HOÀN TẤT!");
    })
    .catch((err) => {
      console.error("[ERROR] LỖI: ", err);
    });
})();
