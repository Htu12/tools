function parseStudentTable(tableSelector) {
    const rows = Array.from(document.querySelectorAll(`${tableSelector} > tbody > tr`));
    if (rows.length === 0) return [];

    const headers = Array.from(rows.shift().querySelectorAll("td")).map(td => td.innerText.trim());

    return rows.slice(0, -1).map(row => {
        const cells = Array.from(row.querySelectorAll("td"));
        return Object.fromEntries(cells.map((cell, i) => [headers[i], cell.innerText.trim()]));
    });
}

const studentMarks = parseStudentTable("#tblStudentMark");
let jsonString = JSON.stringify(studentMarks, null, 2);

//download json
const blob = new Blob([jsonString], { type: "application/json" });
const url = URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = url;
a.download = "student_marks.json";
a.click();
URL.revokeObjectURL(url);    
