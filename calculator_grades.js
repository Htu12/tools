function extractGrades(selectedSubjectCodes = []) {
  const ignoredSubjectsCode = new Set(["GDTC07", "GDTC08", "GDTC06", "TACB01"]);

  const tbody = document
    .getElementById("tblStudentMark")
    .querySelector("tbody");

  if (!tbody) {
    console.error("Không tìm thấy tbody trong bảng.");
    return [];
  }

  const rows = Array.from(tbody.querySelectorAll("tr"));
  if (rows.length === 0) {
    console.error("Không có hàng dữ liệu trong bảng.");
    return [];
  }

  // Lấy dòng tiêu đề
  const headerCells = rows[0].querySelectorAll("td");
  const colIndexes = {};
  const colMapping = {
    "Mã học phần": "subjectCode",
    "Tên học phần": "subjectName",
    "Số TC": "credits",
    "TKHP": "finalScore",
  };

  headerCells.forEach((cell, index) => {
    const headerText = cell.innerText.trim();
    if (colMapping[headerText]) {
      colIndexes[colMapping[headerText]] = index;
    }
  });

  if (Object.values(colIndexes).includes(undefined)) {
    console.error("Không xác định được các cột cần thiết.");
    return [];
  }

  return rows.slice(1).reduce((gradesData, row) => {
    if (row.classList.contains("DataGridFixedHeader")) return gradesData;

    const cells = row.querySelectorAll("td");
    if (cells.length <= Math.max(...Object.values(colIndexes)))
      return gradesData;

    let subjectCode = cells[colIndexes.subjectCode].innerText.trim();
    let subjectName = cells[colIndexes.subjectName].innerText.trim();
    let credits = parseInt(cells[colIndexes.credits].innerText.trim(), 10);
    let finalScore = parseFloat(cells[colIndexes.finalScore].innerText.trim());

    if (!ignoredSubjectsCode.has(subjectCode) && !isNaN(finalScore)) {
      // Nếu không có danh sách mã học phần được chọn, lấy toàn bộ môn hợp lệ
      if (
        selectedSubjectCodes.length === 0 ||
        selectedSubjectCodes.includes(subjectCode)
      ) {
        gradesData.push({
          subjectCode,
          credit_hours: credits,
          final_score: finalScore,
        });
      }
    }

    return gradesData;
  }, []);
}

function convertGradeTo4Scale(grade10) {
  const gradeScale = [
    { min: 9.3, gpa: 4.0 },
    { min: 8.5, gpa: 4.0 },
    { min: 7.8, gpa: 3.5 },
    { min: 7.0, gpa: 3.0 },
    { min: 6.3, gpa: 2.5 },
    { min: 5.5, gpa: 2.0 },
    { min: 4.8, gpa: 1.5 },
    { min: 4.0, gpa: 1.0 },
    { min: 0, gpa: 0.0 },
  ];

  return gradeScale.find((scale) => grade10 >= scale.min).gpa;
}

function calculateAverageGPA(courses, convertTo4Scale = true) {
  if (courses.length === 0) {
    console.warn("Không có môn học nào được tính vào GPA.");
    return 0;
  }

  const { totalPoints, totalCredits } = courses.reduce(
    (acc, course) => {
      let grade = convertTo4Scale
        ? convertGradeTo4Scale(course.final_score)
        : course.final_score;
      acc.totalPoints += grade * course.credit_hours;
      acc.totalCredits += course.credit_hours;
      return acc;
    },
    { totalPoints: 0, totalCredits: 0 }
  );

  return totalCredits === 0 ? 0 : (totalPoints / totalCredits).toFixed(2);
}

(function main() {
  const selectedSubjectCodes = [
    "ĐNQT15",
    "TCQT12",
    "TMQT11",
    "ĐNTC04",
    "QTKD14",
    "ĐNNV03",
    "QLCD01",
  ];

  const gradesData = extractGrades(selectedSubjectCodes);

  if (gradesData.length === 0) {
    console.warn("Không có dữ liệu điểm hợp lệ.");
    return;
  }

  const gpa10 = calculateAverageGPA(gradesData, false);
  const gpa4 = calculateAverageGPA(gradesData, true);

  console.log("Danh sách môn học được tính GPA:", gradesData);
  console.log("GPA theo hệ 10:", gpa10);
  console.log("GPA theo hệ 4.0:", gpa4);
})();
