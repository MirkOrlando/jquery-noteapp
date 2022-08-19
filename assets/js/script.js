$(document).ready(function () {
    dayjs.locale('it')
    dayjs.extend(window.dayjs_plugin_utc);

    getAllNotes();
});

// (1) API Ajax
function getAllNotes() {
    $.ajax({
        type: "GET",
        url: "https://62ff4cf39350a1e548db8783.mockapi.io/noteapp/api/v1/notes?sortBy=updatedAt&order=desc",
        success: function (response) {
            if (response.length > 0) {
                printListNotes(response)
            }
        },
        error: function (error) {
            console.log(error);
        }
    });
}

function printListNotes(data) {
    //Handlebars
    const listYearsContainer = $('#notes_list .notes_list_main .notes_container');
    const source = $('#note-year').html();
    const template = Handlebars.compile(source)

    //get available years
    const years = [];
    data.forEach(note => {
        const year = dayjs(note.updatedAt).format('YYYY');
        if (!years.includes(year)) {
            years.push(year)
        }
    });

    //print for years
    years.forEach(function (year) {
        const html = template({ year });
        listYearsContainer.append(html)

        const notesFiltered = data.filter(function (note) {
            return dayjs(note.updatedAt).format('YYYY')
                === year;
        })

        printNotes(notesFiltered, year)
    })

    activateFirstNote()
}

function printNotes(data, year) {
    //console.log(data, year);
    const listNotesContainer = $('.year' + year + ' ' + '.notes-menu__list');

    const source = $('#note-list-template').html();
    const template = Handlebars.compile(source);

    data.forEach((note) => {
        /* const fakeElement = $('<div></div>').append(note.text)
        console.log(note);
        console.log(fakeElement); */
        const text = note.text.slice(0, 30) + '...'
        //console.log(text);
        const context = { id: note.id, title: note.title, text, updatedAt: dayjs(note.updatedAt).format('DD MMMM YYYY') };
        const html = template(context);
        listNotesContainer.append(html)
    })
}