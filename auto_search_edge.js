let index = 0;
let searchCount = 40;

function doSearch() {
  const q = document.getElementById("sb_form_q");
  const btn = document.getElementById("sb_form_go");

  if (!q || !btn) {
    console.warn("Không tìm thấy phần tử tìm kiếm.");
    return;
  }

  const keywords =
    "ZXCVBNMLKJHGFDSAPOIUYTREWQzxcvbnmlkjhgfdsapoiuytrewq0987654321!@#$%&*";

  const kwLength = 5 + Math.floor(Math.random() * 15); // Từ 5 đến 20 ký tự

  let kw = "";
  for (let i = 0; i < kwLength; i++) {
    const randomOffset = Math.floor(Math.random() * keywords.length);
    kw += keywords[randomOffset];
  }

  q.value = kw;
  btn.click();

  console.log(`Tìm kiếm [${index + 1}/${searchCount}]: ${kw}`);

  index++;
  if (index < searchCount) {
    setTimeout(doSearch, 6000 + Math.floor(Math.random() * 3000)); // Từ 6 đến 9 giây
  } else {
    console.log(`Đã hoàn thành ${searchCount} lượt tìm kiếm!`);
  }
}

doSearch();
