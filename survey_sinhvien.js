function clickSubmit() {
    document.querySelector(".ant-btn.ant-btn-primary").click()
}

function setValue() {
    Array.from(document.querySelectorAll(".ant-radio-input")).forEach(v => v.value === '5' ? v.click() : v)

    // document.querySelector(".ant-input.ant-input-status-success").value = "Không ạ"; khong nhan gia tri
}



function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function demo() {
    console.log("Bắt đầu....");
    await sleep(2000);
    setValue();
    await sleep(5000);
    clickSubmit();
}

demo();
