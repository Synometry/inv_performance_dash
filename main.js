/**
 * 
 * @param {any} o 
 * @returns {boolean}
 */
function isObj(o) {
    return typeof o === 'object' && !Array.isArray(o) && o !== null
}
/**
 * @param {string} id
 * @returns {Element}
 **/
function $(id) { return document.getElementById(id); }

/**
 * @param {string} className
 * @returns {Element}
 **/
function _(className) { return document.getElementsByClassName(className)[0]; }

/**
 * 
 * @param {string} className 
 * @returns {HTMLCollectionOf<Element>}
 */
function _a(className) { return document.getElementsByClassName(className); }

class CalModel extends EventTarget {
    constructor() {
        super();
        this.d = new Date(1, 1, 1);
    }
    initToDate(date) {
        if (this.d.getMonth() != date.getMonth()) this.d.setMonth(date.getMonth());
        if (this.d.getFullYear() != date.getFullYear()) this.d.setYear(date.getFullYear());
        if (this.d.getDate() != date.getDate()) this.d.setDate(date.getDate());
        this.dispatchChangeEvent(true, true);
    }
    getMonth() {
        return this.d.getMonth();
    }
    getMonthName() {
        return this.d.toLocaleString('default', { month: 'long' });
    }
    setMonth(num) {
        if (this.getMonth() != num) {
            let oldY = this.getYear();
            this.d.setMonth(num);
            this.dispatchChangeEvent(oldY != this.getYear(), true);
        }
    }
    getYear() {
        return this.d.getFullYear();
    }
    setYear(num) {
        if (this.getYear() != num) {
            this.d.setFullYear(num);
            this.dispatchChangeEvent(true, false);
        }
    }
    getDate() {
        return this.d.getDate();
    }
    setDate(num) {
        this.d.setDate(num);
        // const e = new CustomEvent("modelDateChanged", {detail: {newNum:num}});
        // this.dispatchEvent(e);
    }
    dispatchChangeEvent(yearChange, monthChange) {
        const e = new CustomEvent("modelDateChanged", {detail: {yearChange, monthChange}})
        this.dispatchEvent(e);
    }
}
let model = new CalModel();
model.addEventListener("modelDateChanged", (e) => {
    if (e.detail.monthChange) $("calendar-month").textContent = model.getMonthName();
    if (e.detail.yearChange) $("calendar-year").textContent = model.getYear();
    if (e.detail.monthChange || e.detail.yearChange) {
        let selNum = getSelectedDate();
        deselectDateCard();
        updateCalendar();
        if (selNum > 0) {
            let el = getDateCard(selNum);
            selectDateCard(el);
        }
    }
    // console.log(`event fired ${e.detail}`)
    // $("calendar-year").textContent = e.detail.newNum;
});


// let dayMapper = {
//     Sunday:0,
//     Monday:1,
//     Tuesday:2,
//     Wednesday:3,
//     Thursday:4,
//     Friday:5,
//     Saturday:6
// };
// Object.keys(dayMapper).forEach((e, i, a) => {
//     dayMapper[dayMapper[e]] = e;
// });

// function getMonthNumber(monthName) {
//     const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
//     const searchName = monthName.toLowerCase().substring(0, 3); 
//     return months.indexOf(searchName) + 1;
// }

function getDays(year, month) {
    const dayList = [];
    const date = new Date(year, month + 1, 0);
    const daysInMonth = date.getDate();
    // console.log("days in month:", daysInMonth)
    for (let i = 1; i <= daysInMonth; i++) {
        date.setDate(i);
        dayList.push({number:i, weekday:date.getDay()})
    }
    return dayList;
}

function populateCalendar() {
    let dCardHtml = _("date-card");
    dCardHtml.id = "dcard1";
    dCardHtml.addEventListener("click", selectDateCard_eventHandle);
    const cal = $("calendar-dategrid");
    for (let i = 0; i < 41; i++) {
        let clone = dCardHtml.cloneNode(true);
        clone.id = `dcard${i + 2}`;
        clone.addEventListener("click", selectDateCard_eventHandle);
        cal.appendChild(clone);
    }
}

function initializeCalendar() {
    populateCalendar();
    const d = new Date();
    model.initToDate(d);
    let el = getDateCard(model.getDate());
    selectDateCard(el);
}

function updateCalendar() {
    // console.log(model.getYear(), model.getMonth());
    const dayList = getDays(model.getYear(), model.getMonth());
    // console.log(dayList);
    let countingUp = true;
    [..._a("date-card")].forEach(e => {
        if (dayList.length > 0) {
            let cNum = parseInt(e.id.replace("dcard", ""));
            //console.log(`card number ${cNum}`);
            let dayObj = dayList.shift();
            //console.log(`comparing to day obj ${dayObj.weekday}`);
            if (countingUp) {
                if(cNum - 1 === dayObj.weekday) {
                    countingUp = false;
                } else {
                    dayList.unshift(dayObj);
                    e.classList.add("unused");
                    e.childNodes[1].textContent = "";
                }
            }
            if (!countingUp) {
                e.childNodes[1].textContent = dayObj.number;
                e.classList.remove(["unused"]);
            }
        } else {
            e.classList.add("unused");
            e.childNodes[1].textContent = "";
        }
    });
}

window.addEventListener('load', () => {
    initializeCalendar();
    // loadFooter();
    // params = new URLSearchParams(window.location.search);
    // if (params.has('projectid')) {
    //     loadProject(params.get('projectid'));
    // }
});

$("calendar-month-button-left").addEventListener("click", () => {
    model.setMonth(model.getMonth() - 1);
})
$("calendar-month-button-right").addEventListener("click", () => {
    model.setMonth(model.getMonth() + 1);
})

let selectionDateCard;

function selectDateCard_eventHandle(e) {
    selectDateCard(e.target);
}

function selectDateCard(el) {
    if (!el.classList.contains(["unused"])) {
        deselectDateCard()
        el.classList.add("selected");
        selectionDateCard = el;
    }
}

function deselectDateCard() {
    if (isObj(selectionDateCard)) {
            selectionDateCard.classList.remove("selected");
            selectionDateCard = null;
    }
}
function getSelectedDate() {
    if (isObj(selectionDateCard)) {
        return parseInt(selectionDateCard.childNodes[1].textContent);
    }
}

function getDateCard(num) {
    let el = null;
    [..._a("date-card")].forEach(e => {
        // console.log(parseInt(e.childNodes[1].textContent), num);
        if (parseInt(e.childNodes[1].textContent) === num) el = e;
    });
    return el;
}