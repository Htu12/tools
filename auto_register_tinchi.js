// ==UserScript==
// @name         APD AutoRegister (resilient)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Tự động view lớp, phát hiện slot trống và chốt đăng ký có kiểm soát
// @author       Huu Tu
// @match        http://tinchi.apd.edu.vn/CMCSoft.IU.Web.info/StudyRegister/StudyRegister.aspx
// @match        https://tinchi.apd.edu.vn/CMCSoft.IU.Web.info/StudyRegister/StudyRegister.aspx
// @icon         https://images.icon-icons.com/4321/PNG/96/direction_arrow_multimedia_option_inport_insert_icon_267818.png
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    /************* CONFIG *************/
    const CONFIG = {
        ACADEMIC_YEAR_VALUE: 'E18317EFDDCA46AC91007128F93B513E',    // drpAcademicYear
        COURSE_VALUE: 'D5572D21CFBD4B09B5B571683F0D6C52',          //  drpCourse

        // chọn dòng thứ mấy (1-based) trong bảng lớp
        COURSE_INDEX_1_BASE: 1,
                                           
        // Chính sách làm mới / vòng lặp
        POLL_MS_MIN: 1200,
        POLL_MS_MAX: 1800,
        VIEW_RETRY_BACKOFF_MS: 2500,
        HARD_REFRESH_AFTER_MS: 3 * 60 * 1000, // auto reload sau 3 phút để tránh state kẹt
        MAX_RUNTIME_MS: 20 * 60 * 1000        // stop sau 20 phút (an toàn)
    };

    /************* Hằng số DOM – mapping control ASP.NET *************/
    const C = {
        ID_SELECT_ACADEMY_YEAR: 'drpAcademicYear',
        ID_SELECT_COURSE: 'drpCourse',
        ID_BUTTON_VIEW_COURSES: 'btnViewCourseClass',
        ID_BUTTON_FILTER_COURSE: 'btnViewFilterCourseClass', // dự phòng
        ID_TABLE_REGIS: 'gridRegistration',
        ID_BUTTON_REGIS: 'btnUpdate',
        CLASS_COURSE_ITEM: 'cssRangeItem2',

        // Cột (index theo <td> trong hàng lớp)
        INDEX_STUDENT_LIMIT: 7,
        INDEX_STUDENT_REGISTERED: 8,

        // Prefix label trong bảng
        ID_PREFIX_COURSE_CLASS: 'gridRegistration_lblCourseClass_'
    };

    /************* Tiện ích đồng bộ / bất đồng bộ *************/
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    const jitter = (min, max) => Math.floor(min + Math.random() * (max - min + 1));
    const toInt = (s) => {
        const m = String(s || '').match(/\d+/g);
        return m ? parseInt(m.join(''), 10) : 0;
    };

    async function waitFor(selector, timeoutMs = 15000) {
        const start = performance.now();
        while (performance.now() - start < timeoutMs) {
            const el = document.querySelector(selector);
            if (el) return el;
            await sleep(50);
        }
        throw new Error(`Timeout đợi selector: ${selector}`);
    }

    function triggerChange(el) {
        el.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function isDisabled(el) {
        return !!(el?.disabled || el?.getAttribute?.('disabled'));
    }

    function getCourseRows() {
        return Array.from(document.querySelectorAll(`.${C.CLASS_COURSE_ITEM}`));
    }

    function getRowByIndex1Base(idx) {
        const rows = getCourseRows();
        return rows[Math.max(0, idx - 1)];
    }

    function extractRowInfo(row, idx0) {
        const clsEl = row.querySelector(`[id^='${C.ID_PREFIX_COURSE_CLASS}${idx0}']`);
        const tds = row.querySelectorAll('td');
        return {
            courseClass: clsEl ? clsEl.innerText.trim() : `#${idx0}`,
            limit: toInt(tds[C.INDEX_STUDENT_LIMIT]?.innerText),
            registered: toInt(tds[C.INDEX_STUDENT_REGISTERED]?.innerText),
            radio: row.querySelector('input[type="radio"]') || row.querySelector('input[id*="rdiSelect"]')
        };
    }

    async function safeClick(el) {
        if (!el) return false;
        el.click?.();
        await sleep(50);
        return true;
    }

    /************* Luồng chính *************/
    async function bootstrap() {
        const t0 = performance.now();
        console.log('[AutoRegister] Bootstrapping…');

        // B1. Wait control ready
        const selYear = await waitFor(`#${C.ID_SELECT_ACADEMY_YEAR}`);
        const selCourse = await waitFor(`#${C.ID_SELECT_COURSE}`);
        const btnView = await waitFor(`#${C.ID_BUTTON_VIEW_COURSES}`);

        // B2. Set filters (year, course)
        if (selYear.value !== CONFIG.ACADEMIC_YEAR_VALUE) {
            selYear.value = CONFIG.ACADEMIC_YEAR_VALUE;
            triggerChange(selYear);
            await sleep(150);
        }
        if (selCourse.value !== CONFIG.COURSE_VALUE) {
            selCourse.value = CONFIG.COURSE_VALUE;
            triggerChange(selCourse);
            await sleep(150);
        }

        // B3. Đảm bảo đã load bảng lớp
        if (getCourseRows().length === 0) {
            console.log('[AutoRegister] Chưa thấy hàng lớp → ViewCourse');
            await safeClick(btnView);
            // chờ postback/partial update
            await sleep(CONFIG.VIEW_RETRY_BACKOFF_MS);
        }

        // B4. Vòng lặp polling chiến lược
        while (true) {
            // Ngắt theo max runtime
            if (performance.now() - t0 > CONFIG.MAX_RUNTIME_MS) {
                console.warn('[AutoRegister] Hết phiên làm việc theo chính sách MAX_RUNTIME_MS. Kết thúc.');
                return;
            }

            // Thỉnh thoảng hard-refresh để reset state ASP.NET
            if ((performance.now() - t0) > CONFIG.HARD_REFRESH_AFTER_MS) {
                console.log('[AutoRegister] Hard refresh theo chu kỳ an toàn…');
                location.reload();
                return;
            }

            // Nếu nút Đăng ký đang disable (đang postback) thì đợi
            const btnReg = document.getElementById(C.ID_BUTTON_REGIS);
            if (btnReg && isDisabled(btnReg)) {
                console.log('[AutoRegister] btnUpdate đang disable → đợi vòng sau');
                await sleep(jitter(CONFIG.POLL_MS_MIN, CONFIG.POLL_MS_MAX));
                continue;
            }

            // Nếu bảng chưa có dữ liệu → ViewCourse
            let rows = getCourseRows();
            if (rows.length === 0) {
                console.log('[AutoRegister] Không thấy hàng lớp → ViewCourse lại');
                await safeClick(btnView);
                await sleep(CONFIG.VIEW_RETRY_BACKOFF_MS);
                rows = getCourseRows();
            }

            // Chọn dòng theo index 1-based
            const idx1 = CONFIG.COURSE_INDEX_1_BASE;
            const row = getRowByIndex1Base(idx1);
            if (!row) {
                console.warn(`[AutoRegister] Không tìm thấy hàng lớp index=${idx1}. Sẽ ViewCourse lại.`);
                await safeClick(btnView);
                await sleep(CONFIG.VIEW_RETRY_BACKOFF_MS);
                await sleep(jitter(CONFIG.POLL_MS_MIN, CONFIG.POLL_MS_MAX));
                continue;
            }

            // Đọc thông tin lớp
            const info = extractRowInfo(row, idx1 - 1);
            console.log(`[AutoRegister] Lớp ${info.courseClass} — Đã đăng ký ${info.registered}/${info.limit}`);

            // Case 1: Còn chỗ → chọn radio + bấm Đăng ký
            if (info.registered < info.limit && info.radio) {
                // chọn radio
                if (!info.radio.checked) info.radio.checked = true;

                // chờ nhỏ để ASP.NET bind selection
                await sleep(120);

                // click đăng ký
                console.log("[Test dang ky] Yes");
                // const clicked = await safeClick(btnReg); // Bỏ comment để chạy thật
                console.log(`[AutoRegister] ${clicked ? 'ĐÃ BẤM' : 'KHÔNG THỂ BẤM'} nút Đăng ký`);
                // Sau khi bấm sẽ postback → break hoặc chờ trang xử lý
                await sleep(2000);
                // Tuỳ policy: dừng để người dùng xác thực kết quả
                return;
            }

            // Case 2: Hết chỗ → refresh danh sách bằng ViewCourse
            await sleep(jitter(CONFIG.POLL_MS_MIN, CONFIG.POLL_MS_MAX));
            await safeClick(btnView);
            await sleep(400 + Math.random() * 400);
        }
    }

    /************* Fail-safe khởi động *************/
    // Đảm bảo chạy sau khi ASP.NET đã render xong
    (async () => {
        try {
            await sleep(500); // đệm
            await bootstrap();
        } catch (e) {
            console.error('[AutoRegister] Lỗi khởi động:', e);
            // Phục hồi trạng thái bằng refresh mềm
            setTimeout(() => location.reload(), 5000);
        }
    })();

})();
