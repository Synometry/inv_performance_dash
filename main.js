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

function parseTimeString(timeString) {
    const cleanStr = timeString.trim().toLowerCase();
    const isPm = cleanStr.includes('pm');
    const isAm = cleanStr.includes('am');
    const timeOnly = cleanStr.replace(/(am|pm)/g, '').trim();
    let [hours, minutes] = timeOnly.split(':').map(Number);
    if (isPm && hours !== 12) {
        hours += 12;
    } if (isAm && hours === 12) {
        hours = 0;
    }
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
}

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
        if (this.getMonth() !== num) {
            let oldDay = this.getDate();
            let oldY = this.getYear();
            this.d.setDate(1);
            this.d.setMonth(num + 1);
            this.d.setDate(0);
            let daysInMonth = this.getDate();
            this.d.setDate(Math.min(oldDay, daysInMonth));
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
    toISODateString() {
        return this.d.toISOString().split("T")[0];
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
    if (e.detail.monthChange || e.detail.yearChange) {;
        deselectDateCard();
        updateCalendar();
        let el = getDateCard(model.getDate());
        selectDateCard(el);
    }
});

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
    updateCalendar();
}

function updateCalendar() {
    // console.log(model.getYear(), model.getMonth());
    const dayList = getDays(model.getYear(), model.getMonth());
    let dTemp = new Date(model.getYear(), model.getMonth());
    // console.log(dayList);
    let countingUp = true;
    [..._a("date-card")].forEach(e => {
        e.classList.remove("positive", "negative");
        e.children[1].textContent = "";
        e.children[2].textContent = "";
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
                    e.classList.add(["unused"]);
                    e.childNodes[1].textContent = "";
                }
            }
            if (!countingUp) {
                e.children[0].textContent = dayObj.number;
                dTemp.setDate(dayObj.number);
                let dKey = dTemp.toISOString().split("T")[0];
                if (Object.hasOwn(dayAggregations, dKey)) {
                    let val = dayAggregations[dKey].pGain;
                    let valStr = val.toFixed(2) + "%";
                    if (val >= 0) {
                        valStr = "+" + valStr;
                    }
                    e.children[1].textContent = valStr;
                    val = dayAggregations[dKey].dGain;
                    valStr = val.toFixed(2);
                    if (val >= 0) {
                        e.classList.add("positive");
                        valStr = "+$" + valStr;
                    } else {
                        e.classList.add("negative");
                        valStr = valStr.replace("-", "-$");
                    }
                    e.children[2].textContent = valStr;
                }
                e.classList.remove(["unused"]);
            }
        } else {
            e.classList.add("unused");
            e.childNodes[1].textContent = "";
        }
    });
}

let jsonRecord;
let recordEntryHTML;
let blurOnEnter = (e) => {if (e.key === 'Enter') {e.target.blur();}};
let dayAggregations = {};

async function loadData() {
    recordEntryHTML = await fetchHTML("./scraps/record_row");
    jsonRecord = await fetchJSON("./record.json");
    calcDayAggregates();
    loadTradesByDate(model.d);
}
function calcDayAggregates() {
    Object.keys(jsonRecord.trades).forEach((dKey) => {
        dayAggregations[dKey] = {
            "dGain":_calc_dGainForDate(dKey),
            "pGain":_calc_pGainForDate(dKey) 
        };
    });
}
function _calc_dGainForDate(date) {
    let sum = 0;
    jsonRecord.trades[date].forEach((record) => {
        sum += record.exit - record.entry;
    });
    return sum;
}
function _calc_pGainForDate(date) {
    let posChanges = [];
    jsonRecord.trades[date].forEach((record) => {
        posChanges.push({
            time:+parseTimeString(record.entry_time),
            capChange:-record.entry
        });
        posChanges.push({
            time:+parseTimeString(record.exit_time),
            capChange:record.exit
        });
    });
    //sort list by time
    posChanges.sort((x, y) => x.time - y.time);
    let capDelt = 0;
    let minDelt = 0;
    //step through list, assigning two variables above as needed
    for (let i = 0; i < posChanges.length; i++) {
        capDelt += posChanges[i].capChange;
        minDelt = Math.min(minDelt, capDelt);
    }
    return ((minDelt-capDelt)/minDelt-1)*100;
}
function loadTradesByDate(date) {
    let dKey = model.toISODateString();
    // console.log("date key is", dKey);
    // TODO calculate %-gain per day, put it
    //      in object, parallelize it with the view, etc.
    if (isObj(jsonRecord) && Object.hasOwn(jsonRecord.trades, dKey)) {
        jsonRecord.trades[dKey].forEach((e) => recordTableAddRow(e));
    }
}
window.addEventListener('load', async () => {
    await loadData();
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
    if (selectionDateCard !== e.target) selectDateCard(e.currentTarget);
}

function selectDateCard(el) {
    if (!el.classList.contains(["unused"])) {
        saveRows();
        deselectDateCard()
        el.classList.add("selected");
        selectionDateCard = el;
        let selDay = getSelectedDate();
        model.setDate(selDay)
        _("short-date-label").textContent = model.toSlashString();
        $("record-date-label").textContent = model.toLongString();
        clearRecordTable()
        loadTradesByDate(model.d);
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

/**
 * TABLE FUNCTIONS
 */
function saveRows() {
    document.querySelectorAll("tbody tr").forEach((row) => saveRow(row));
}
function saveRow(el) {
    console.log("1/5 Saving");
    let cells = el.querySelectorAll("td");
    let id = cells[0].textContent;
    console.log("2/5 Saving row with id", id);
    let dKey = model.toISODateString();
    console.log("3/5 Accessing record object at date", dKey);
    if (Object.hasOwn(jsonRecord.trades, dKey)) {
        console.log("4/5 Found records in object under date");
        trades = jsonRecord.trades[dKey];
        for (let i = 0; i < trades.length; i++) {
            let trade = trades[i];
            console.log("row",i, "has id", trade.id);
            if (trade.id === id) {
                console.log("5/5 Found record with matching id. Saving...");
                trade.entry_time = cells[1].firstElementChild.value;
                trade.exit_time = cells[2].firstElementChild.value;
                trade.entry = +stripStr(cells[3].firstElementChild.value);
                console.log("Saving entry", +stripStr(cells[3].firstElementChild.value));
                trade.exit = +stripStr(cells[4].firstElementChild.value);
                console.log("Saving exit", +stripStr(cells[4].firstElementChild.value));
                break;
            }
        }
    }
}
function recalcRow(el) {
    calcDayAggregates();
    updateCalendar();
    let cells = el.querySelectorAll("td");
    const entryNum = +stripStr(cells[3].firstElementChild.value);
    const exitNum = +stripStr(cells[4].firstElementChild.value);
    cells[5].textContent = (exitNum - entryNum).toFixed(2);
    cells[6].textContent = ((exitNum/entryNum - 1)*100).toFixed(2);
}
function refreshRow(el) {
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

function clearRecordTable() {
    document.querySelector("tbody").innerHTML = "";
}
function recordTableAddRow(recordObj) {
    // console.log(recordEntryHTML);
    let rowElement = textToHTML(recordEntryHTML);
    // console.log(rowElement);
    let cells = rowElement.querySelectorAll("td");
    cells[0].textContent = recordObj.id;
    cells[1].firstElementChild.value = recordObj.entry_time;
    cells[2].firstElementChild.value = recordObj.exit_time;
    let entryNum = parseFloat(recordObj.entry);
    cells[3].firstElementChild.value = entryNum;
    cells[3].firstElementChild.addEventListener("focus", (e) => stripInput(e.target));
    cells[3].firstElementChild.addEventListener("blur", (e) => { saveRow(e.target.parentNode.parentNode); refreshRow(e.target.parentNode.parentNode); });
    cells[3].firstElementChild.addEventListener("keydown", blurOnEnter);
    let exitNum = parseFloat(recordObj.exit);
    cells[4].firstElementChild.value = exitNum;
    cells[4].firstElementChild.addEventListener("focus", (e) => stripInput(e.target));
    cells[4].firstElementChild.addEventListener("blur", (e) => { saveRow(e.target.parentNode.parentNode); refreshRow(e.target.parentNode.parentNode); });
    cells[4].firstElementChild.addEventListener("keydown", blurOnEnter);
    refreshRow(rowElement);
    $("record-list").querySelector("tbody").appendChild(rowElement);
}

/** TABLE TOOL BAR FUNCTIONS */
function recordIDExists(dKey, id) {
    for (let i = 0; i < jsonRecord.trades[dKey].length; i++) {
        if (jsonRecord.trades[dKey][i].id === ""+id) return true;
    }
    return false;
}

$("record-add-button").addEventListener("click", (e) => {
    if (isObj(jsonRecord)) {
        // get date for records key and id
        let dKey = model.toISODateString();
        // come up with an id
        let newID = dKey.replaceAll("-", "") + "0";
        // if there are no records for our date, we can skip the id checking
        if (Object.hasOwn(jsonRecord.trades, dKey)) {
            // check if id is in use - iterate if so
            while (true) {
                if (recordIDExists(dKey, newID)) {
                    // console.log(newID);
                    newID = ""+(+newID+1);
                } else break;
            }
        } else {
            // add a new list of trades under our date
            jsonRecord.trades[dKey] = [];
        }
        // create new record object
        let o = {
            "id":newID,
            "entry_time":"6:30 AM",
            "exit_time":"6:30 AM",
            "entry":0.00,
            "exit":0.00
        }
        // add record to json
        jsonRecord.trades[dKey].push(o);
        // instantiate new row and add
        recordTableAddRow(o);
    }
});








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