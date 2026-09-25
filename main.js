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

function getDays(month, year) {
    const dayList = [];
    const date = new Date();
    const daysInMonth = new Date(year, month, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
        date.setDate(i);
        dayList.push({number:i, weekday:date.getDay()})
    }
    return dayList;
}
console.log(getDays(2026, 9));