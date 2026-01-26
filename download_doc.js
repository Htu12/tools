(function () {
  "use strict";

  function downloadPDF() {
    console.clear();
    const statusBtn = document.getElementById("apd-download-btn");
    statusBtn.innerText = "⏳ Đang quét...";
    statusBtn.style.backgroundColor = "#f39c12"; // Màu cam chờ đợi

    // 1. Tìm nút "Xem toàn văn" để lấy Hash và ID
    var regex1 = /xemtoanvan\('(https:[^']+\/hash\/[a-f0-9]+)'/;
    var regex2 = /window\.open\(['"](https?:\/\/[^'"]+)['"]/;

    var htmlContent = document.body.innerHTML;
    var match1 = htmlContent.match(regex1);
    var match2 = htmlContent.match(regex2);

    var fullLink = null;
    var target = null; // 1: xemtoanvan, 2: window.open

    if (match1) {
      fullLink = match1[1];
      target = 1;
    } else if (match2) {
      fullLink = match2[1];
      target = 2;
    } else {
      console.error(
        "[ERROR] Không tìm thấy link 'Xem toàn văn'. Cấu trúc web có thể đã đổi.",
      );
      return;
    }

    console.log("[DEBUG] LINK GỐC:", fullLink);
    console.log("[DEBUG] TARGET:", target);

    // 2. Trích xuất ID và Hash từ link
    var idMatch = fullLink.match(/\/id\/(\d+)/);
    var hashMatch = fullLink.match(/\/hash\/([a-f0-9]+)/);

    if (!idMatch || !hashMatch) {
      alert("❌ Không tách được ID/Hash. Web có thể đã đổi cấu trúc.");
      resetButton();
      return;
    }

    var docId = idMatch[1];
    var docHash = hashMatch[1];
    var timestamp = Math.floor(Date.now() / 1000);

    console.log(`[DEBUG] ID: ${docId} | Hash: ${docHash}`);
    statusBtn.innerText = "🚀 Đang tải...";

    // 3. Gọi API
    var apiUrl = `https://thuvienso.apd.edu.vn/doc/loadpdf2?id=${docId}&t1=${timestamp}&hash=${docHash}&t1=${timestamp}`;

    fetch(apiUrl, {
      headers: { APP_KEY: docHash },
    })
      .then((response) => {
        if (!response.ok) throw new Error("Lỗi kết nối: " + response.status);
        return response.text();
      })
      .then((dirtyData) => {
        statusBtn.innerText = "🧹 Đang lọc rác...";

        // 4. Lọc mã rác (#excRCQWQP...b)
        var cleanData = dirtyData.replace(/#excRCQWQP.*?b/g, "");

        if (dirtyData.length === cleanData.length) {
          console.warn("⚠️ Cảnh báo: Không tìm thấy mã rác để lọc.");
        } else {
          console.log("[INFO] ĐÃ XÓA MÃ RÁC THÀNH CÔNG!");
        }

        // 5. Chuyển đổi và Tải về
        var byteCharacters = atob(cleanData);
        var byteNumbers = new Array(byteCharacters.length);
        for (var i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        var byteArray = new Uint8Array(byteNumbers);
        var blob = new Blob([byteArray], { type: "application/pdf" });

        var link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = `Tai_lieu_${docId}.pdf`;
        link.click();

        console.log("[INFO] HOÀN TẤT!");
        statusBtn.innerText = "✅ Tải xong!";
        statusBtn.style.backgroundColor = "#27ae60"; // Màu xanh lá
        setTimeout(resetButton, 3000);
      })
      .catch((err) => {
        console.error("[ERROR] LỖI: ", err);
        alert("❌ Lỗi: " + err.message);
        resetButton();
      });
  }

  // Hàm reset nút về trạng thái ban đầu
  function resetButton() {
    const btn = document.getElementById("apd-download-btn");
    if (btn) {
      btn.innerText = "📥 Tải PDF Về Máy";
      btn.style.backgroundColor = "#2980b9";
    }
  }

  // --- TẠO GIAO DIỆN NÚT BẤM ---
  function createUI() {
    const btn = document.createElement("button");
    btn.id = "apd-download-btn";
    btn.innerText = "📥 Tải PDF Về Máy";

    // Style cho nút (Nổi bật ở góc trái dưới)
    Object.assign(btn.style, {
      position: "fixed",
      bottom: "20px",
      left: "20px",
      zIndex: "99999",
      padding: "12px 20px",
      backgroundColor: "#2980b9", // Màu xanh dương
      color: "white",
      border: "none",
      borderRadius: "5px",
      boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
      cursor: "pointer",
      fontWeight: "bold",
      fontSize: "14px",
      fontFamily: "Arial, sans-serif",
    });

    // Hiệu ứng hover
    btn.onmouseover = () => (btn.style.backgroundColor = "#3498db");
    btn.onmouseout = () => {
      if (btn.innerText === "📥 Tải PDF Về Máy") {
        btn.style.backgroundColor = "#2980b9";
      }
    };

    // Gán sự kiện click
    btn.onclick = downloadPDF;

    document.body.appendChild(btn);
  }

  // Chờ trang load xong thì hiện nút
  window.addEventListener("load", createUI);
})();
