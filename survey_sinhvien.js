//function click submit
function clickSubmit() {
    document.querySelector(".ant-btn.ant-btn-primary").click();
}

//function set value input
function setNativeValue(element, value) {
    // Get the native value setter from HTMLInputElement prototype
    const valueSetter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
    ).set;
    const prototype = Object.getPrototypeOf(element);
    const prototypeValueSetter = Object.getOwnPropertyDescriptor(
        prototype,
        "value",
    )?.set;

    if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
        prototypeValueSetter.call(element, value);
    } else {
        valueSetter.call(element, value);
    }

    // Dispatch events that React listens to
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
}

//function set value
function setValue() {
    // Click radio buttons with value '5'
    Array.from(document.querySelectorAll(".ant-radio-input")).forEach((v) => {
        if (v.value === "5") {
            v.click();
        }
    });

    // Set text input values using native setter
    const textInputs = document.querySelectorAll(".ant-input");
    textInputs.forEach((input) => {
        if (input.value === "" || input.value === undefined) {
            setNativeValue(input, "Em không có ý kiến gì ạ");
        }
    });
}

//delay function
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

//main function
async function main() {
    console.log("Bắt đầu....");
    await sleep(2000);
    setValue();
    await sleep(5000);
    clickSubmit();
}

main();
