'use strict';

const fs = require('fs');

class CsvFilter {
    #CONSTANT = {
        DEFAULT_FILEPATH: "./nhansu_ttlt_vii.csv"
    }

    /**
     * @param {String} filePath
     */
    constructor(filePath) {
        this.filePath = filePath || this.#CONSTANT.DEFAULT_FILEPATH;
    }

    /**
     * Handles reading the CSV file and parsing its content.
     * @returns {Array} data
     */
    #handelReadFile() {
        let result = []
        fs.readFileSync(this.filePath, "utf-8").split("\n").forEach(member => {
            const [memberNo, fullName, phoneNumber, dateOfBirth, address, clubCommittee, position] = member.split(",").slice(0, 7);
            result.push({
                memberNo: memberNo.trim(),
                fullName: fullName.trim(),
                phoneNumber: phoneNumber.trim(),
                dateOfBirth: dateOfBirth.trim(),
                address: address.trim(),
                clubCommittee: clubCommittee.trim(),
                position: position.trim()
            });
        });

        return result;
    }

    /**
     * Retrieves the unique club committees from the member data.
     * @returns {Array} Unique club committees
     */
    #options() {
        let data = this.#handelReadFile();
        let result = [];

        data.forEach(member => {
            let f = member.clubCommittee;
            if (!result.includes(f)) {
                result.push(f);
            }
        });

        return result;
    }

    /**
     * Retrieves the unique months from the member data.
     * @returns {Array} Unique months
     */
    #arrMonths() {
        let data = this.#handelReadFile();
        let result = [];

        data.forEach(member => {
            let m = member.dateOfBirth.split("/")[1];

            //check
            // Number(m) <= 12 ? console.log(m) : console.log("memNo: ", v.memberNo, "\tMonth: ", Number(m));

            if (!result.includes(m)) {
                result.push(m);
            }
        });

        return result;
    }

    /**
     * Retrieves the total number of members.
     * @returns {Number} Total number of members
     */
    #totalMember() {
        return this.#handelReadFile().length;
    }

    /**
     * Retrieves the member data.
     * @returns {Array} Member data
     */
    getDataMember() {
        return this.#handelReadFile();
    }

    /**
     * Writes the member data to a new CSV file.
     * @param {String} path - The file path to write the new CSV file.
     */
    writeNewFile(path) {
        const data = this.#handelReadFile();
        const csvContent = data.map(member => {
            return `${member.memberNo},
                    ${member.fullName},
                    ${member.phoneNumber},
                    ${member.dateOfBirth},
                    ${member.address},
                    ${member.clubCommittee},
                    ${member.position}`;
        }).join("\n");

        fs.writeFileSync(path, csvContent, "utf-8", (err) => {
            if (err) {
                throw new Error("Error writing CSV file:", err);
            }
            console.log("Successfully!");
        });
    }

    /**
     * Filters members by their club committee.
     * @returns {Object} Filtered members by club committee
     */
    filterMemberClubCommittee() {
        let op = this.#options();
        let data = this.#handelReadFile();
        let result = [];

        op.forEach(option => {
            result[option] = [];

            data.forEach(member => {
                if (member.clubCommittee === option) {
                    result[option].push(member);
                }
            });

        });

        result["total"] = this.#totalMember();

        return result;
    }

    /**
     * Filters members by their month of birth.
     * @returns {Object} Filtered members by month of birth
     */
    filterMemberByMonthBirthDay() {
        const data = this.#handelReadFile();       
        const arrMonths = this.#arrMonths();       
        const result = {};                         

        arrMonths.forEach(month => {
            result[`month_${month}`] = { members: [], total: 0 };
        });

        data.forEach(member => {
            const memMonth = String(member?.dateOfBirth?.split?.("/")?.[1] || "")
                .padStart(2, "0");

            const key = `month_${memMonth}`;
            if (result[key]) {
                const line = `${member.fullName} - ${member.dateOfBirth} - ${member.clubCommittee} - ${member.position}`;
                result[key].members.push(line);
                result[key].total += 1;
            }
        });

        return result;
    }


}

let s1 = new CsvFilter()
// console.log(s1.getDataMember());
// console.log(s1.filterMemberClubCommittee());
console.log(s1.filterMemberByMonthBirthDay());
