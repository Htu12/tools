'use strict';

const fs = require('fs');
const path = require('path');

class TTLT {
    #CONST = {
        DEFAULT_PATH: './data.csv',
        OUTPUT_DIR: './Results',
        ROLE_PRIORITY: {
            'Cố Vấn': 1,
            'Trưởng Ban': 2,
            'Phó Ban': 2, // Cùng cấp ưu tiên
            'Thành Viên': 3
        }
    };

    constructor(filePath) {
        this.filePath = filePath || this.#CONST.DEFAULT_PATH;
    }

    // --- CÁC PHƯƠNG THỨC PRIVATE ---

    #writeFileSync(filePath, data) {
        try {
            const dir = path.dirname(filePath);

            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(filePath, data, 'utf-8');
            console.log(`Đã xuất file thành công: ${filePath}`);
        } catch (err) {
            console.error(`Lỗi khi ghi file ${filePath}:`, err.message);
        }
    }

    //1. Đọc và phân tích dữ liệu từ file CSV
    #getParsedData() {
        if (!fs.existsSync(this.filePath)) {
            console.error(`Không tìm thấy file: ${this.filePath}`);
            return [];
        }

        return fs.readFileSync(this.filePath, 'utf-8')
            .split('\n')
            .filter(line => line.trim()) // Bỏ qua các dòng trống để tránh lỗi undefined
            .map(member => {
                const [fullName, dateOfBirth, clubCommittee, position] = member.split(',');
                return {
                    fullName: fullName?.trim() || '',
                    dateOfBirth: dateOfBirth?.trim() || '',
                    clubCommittee: clubCommittee?.trim() || '',
                    position: position?.trim() || ''
                };
            });
    }

    // --- CÁC PHƯƠNG THỨC PUBLIC ---

    // 3. Gom nhóm thành viên theo tháng sinh bằng một vòng lặp duy nhất
    groupMembersByBirthMonth() {
        const data = this.#getParsedData();
        const result = {};

        data.sort((a, b) => {
            const priorityA = this.#CONST.ROLE_PRIORITY[a.position] || 99; // Chức lạ đẩy xuống cuối
            const priorityB = this.#CONST.ROLE_PRIORITY[b.position] || 99;

            // Sắp xếp theo chức vụ trước
            if (priorityA !== priorityB) {
                return priorityA - priorityB;
            }

            //Nếu cùng chức vụ, sắp xếp theo độ tuổi
            const [dayA, monthA, yearA] = a.dateOfBirth.split('/');
            const [dayB, monthB, yearB] = b.dateOfBirth.split('/');

            const timeA = new Date(`${yearA}-${monthA}-${dayA}`).getTime();
            const timeB = new Date(`${yearB}-${monthB}-${dayB}`).getTime();

            return timeA - timeB;
        });

        // Gom nhóm theo tháng
        data.forEach(member => {
            const month = member.dateOfBirth?.split('/')[1]?.padStart(2, '0');

            if (!month) return; // Bỏ qua nếu dữ liệu ngày sinh bị lỗi

            const key = `month_${month}`;
            if (!result[key]) {
                result[key] = { members: [], total: 0 };
            }

            const line = `${member.fullName} - ${member.dateOfBirth} - ${member.clubCommittee} - ${member.position}`;
            result[key].members.push(line);
            result[key].total += 1;
        });

        return result;
    }

    // 4. Xuất file TXT
    writeTxtFileFilterBirthday() {
        const groupedData = this.groupMembersByBirthMonth();
        let filesCreated = 0;

        for (const [key, data] of Object.entries(groupedData)) {
            const output = data.members.join('\n') +
                `\n---------------------------------------------------------\n` +
                `Tổng số thành viên: ${data.total}\n\n`;

            this.#writeFileSync(`${this.#CONST.OUTPUT_DIR}/birthday_${key}.txt`, output);
            filesCreated++;
        }

        return filesCreated > 0;
    }

    cleanRawData(rawFilePath) {
        const map = {
            'tcsk': 'Ban Tổ Chức Sự Kiện',
            'tt': 'Ban Truyền Thông',
            'ns': 'Ban Nhân Sự',
            'cq': 'Ban Cần Quỹ',
        };

        const rawData = fs.readFileSync(rawFilePath, "utf-8").split("\n").filter(line => line.trim());
        const result = rawData.map(member => {
            const [memberNo, fullName, phoneNumber, dateOfBirth, address, position] = member.split(",").map(i => i?.trim());

            const capitalizedName = fullName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
            const formattedDate = dateOfBirth.split('/').map(d => d.padStart(2, '0')).join('/');
            const deptKey = rawFilePath.split('/').pop().split('.')[0];

            return `${capitalizedName},${formattedDate},${map[deptKey] || 'Chưa rõ'},${position}`;
        });

        this.#writeFileSync(this.filePath, result.join('\n'));
    }
}

const a = new TTLT();
a.writeTxtFileFilterBirthday();