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

async function fetchHTML(path) {
    try {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.text();
    } catch (error) {
        console.error(`Could not load HTML file at \'${path}\':`, error);
    }
}

async function fetchJSON(path) {
    try {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`Could not load JSON file at \'${path}\':`, error);
    }
}

/**
 * @param {string} text
 * @returns {Element}
 **/
function textToHTML(text) {
    const temp = document.createElement("template");
    temp.innerHTML = text;
    // console.log(temp.content.firstChild);
    return temp.content.firstChild;
}

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
    toSlashString() {
        return `${this.getMonth()+1}/${this.getDate()}/${this.getYear()}`;
    }
    toLongString() {
        return this.d.toLocaleString('default', { year: 'numeric', month: 'long', day: 'numeric' });
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
        if (Number.isInteger(selNum)) {
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

let jsonRecord;
let jsonLiveRecord;
let recordEntryHTML;
let blurOnEnter = (e) => {if (e.key === 'Enter') {e.target.blur();}};

async function loadData() {
    recordEntryHTML = await fetchHTML("./scraps/record_row");
    jsonRecord = await fetchJSON("./record.json");
    let dKey = model.d.toISOString().split("T")[0];
    let tab = $("record-list").querySelector("tbody");
    // console.log("date key is", dKey);
    // TODO calculate %-gain per day, put it
    //      in object, parallelize it with the view, etc.
    if (Object.hasOwn(jsonRecord.trades, dKey)) {
        jsonRecord.trades[dKey].forEach((e) => {
            console.log(recordEntryHTML);
            let rowElement = textToHTML(recordEntryHTML);
            console.log(rowElement);
            let cells = rowElement.querySelectorAll("td");
            cells[0].textContent = e.id;
            cells[1].firstElementChild.value = e.entry_time;
            cells[2].firstElementChild.value = e.exit_time;
            let entryNum = parseFloat(e.entry);
            cells[3].firstElementChild.value = entryNum;
            cells[3].firstElementChild.addEventListener("focus", (e) => stripInput(e.target));
            cells[3].firstElementChild.addEventListener("blur", (e) => refreshRow(e.target.parentNode.parentNode));
            cells[3].firstElementChild.addEventListener("keydown", blurOnEnter);
            let exitNum = parseFloat(e.exit);
            cells[4].firstElementChild.value = exitNum;
            cells[4].firstElementChild.addEventListener("focus", (e) => stripInput(e.target));
            cells[4].firstElementChild.addEventListener("blur", (e) => refreshRow(e.target.parentNode.parentNode));
            cells[4].firstElementChild.addEventListener("keydown", blurOnEnter);
            refreshRow(rowElement);
            tab.appendChild(rowElement);
        });
    }
}

window.addEventListener('load', () => {
    initializeCalendar();
    loadData();
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
        let selDay = getSelectedDate();
        model.setDate(selDay)
        _("short-date-label").textContent = model.toSlashString();
        $("record-date-label").textContent = model.toLongString();
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
        return parseInt(selectionDateCard.firstElementChild.textContent);
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
function saveRow(el) {
    let cells = el.querySelectorAll("td");
    let id = cells[0].textContent;
    let dKey = model.d.toISOString().split("T")[0];
    if (Object.hasOwn(jsonRecord.trades, dKey)) {
        trades = jsonRecord.trades[dKey];
        let changesMade = false;
        for (let i = 0; i < trades.length; i++) {
            let trade = trades[i];
            if (trade.id === id) {
                trade.entry_time = cells[1].firstElementChild.value;
                trade.exit_time = cells[2].firstElementChild.value;
                trade.entry = cells[3].firstElementChild.value;
                trade.exit = cells[4].firstElementChild.value;
                changesMade = true;
                break;
            }
        }
    }
}
function recalcRow(el) {
    let cells = el.querySelectorAll("td");
    const entryNum = +stripStr(cells[3].firstElementChild.value);
    const exitNum = +stripStr(cells[4].firstElementChild.value);
    cells[5].textContent = (exitNum - entryNum).toFixed(2);
    cells[6].textContent = ((exitNum/entryNum - 1)*100).toFixed(2);
}
function refreshRow(el) {
    saveRow(el);
    recalcRow(el);
    let cells = el.querySelectorAll("td");
    stripInput(cells[3].firstElementChild);
    cells[3].firstElementChild.value = "$"+(+cells[3].firstElementChild.value).toFixed(2);
    stripInput(cells[4].firstElementChild);
    cells[4].firstElementChild.value = "$"+(+cells[4].firstElementChild.value).toFixed(2);
    stripCell(cells[5]);
    let dGainVal = +cells[5].textContent;
    if (dGainVal>=0) {
        cells[5].classList.add(["positive"]);
        cells[5].textContent = "$"+dGainVal.toFixed(2);
    } else {
        cells[5].classList.add(["negative"]);
        cells[5].textContent = dGainVal.toFixed(2).replace("-", "-$");
    }
    stripCell(cells[6]);
    let pGainVal = +cells[6].textContent;
    if (pGainVal>=0) {
        cells[6].classList.add(["positive"]);
    } else {
        cells[6].classList.add(["negative"]);
    }
    cells[6].textContent = pGainVal.toFixed(2)+"%";
}
function stripStr(text) {
    return text.replace(/[^\d.-]/g, '');
}
function stripInput(cell) {
  cell.value = stripStr(cell.value);
}
function stripCell(cell) {
  cell.textContent = stripStr(cell.textContent);
}













$("download-button").addEventListener("click", () => {
  const jsonString = JSON.stringify(jsonRecord, null, 4);
  const b = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(b);
  const a = document.createElement('a');
  a.href = url;
  a.download = "record.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});