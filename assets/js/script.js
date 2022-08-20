const ckEditor = {
    editorInstance: {}
}

let timout = null;

$(document).ready(function () {
    dayjs.locale('it')
    dayjs.extend(window.dayjs_plugin_utc);

    getAllNotes();

    // change active note when click on a note
    $(document).on('click', '.notes-menu__list__item', function () {
        if (ckEditor.editorInstance.id) {
            ckEditor.editorInstance.destroy();
            ckEditor.editorInstance = {};
        }
        const activeNote = $(this);
        activeNote.addClass('active').siblings().removeClass('active');
        getNote(activeNote.data('id'))
    })

    // update note text
    $(document).on('keyup', '#note_edit .note .ck-editor__main .ck-content', function () {
        updateNote()
    })

    // update note title
    $(document).on('keyup', '#note_edit .note .title', function () {
        updateNote()
    })

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
        const fakeElement = $('<div></div>').append(note.text)
        const text = fakeElement.text().slice(0, 30) + '...'
        const context = { id: note.id, title: note.title, text, updatedAt: dayjs(note.updatedAt).format('DD MMMM YYYY') };
        const html = template(context);
        listNotesContainer.append(html)
    })
}

// get one note and activate
function activateFirstNote() {
    const firstNote = $('.notes-menu__year:first-child .notes-menu__list .notes-menu__list__item:first-child');
    firstNote.addClass('active')

    getNote(firstNote.data('id'))
}

function getNote(id) {
    $.ajax({
        type: "GET",
        url: `https://62ff4cf39350a1e548db8783.mockapi.io/noteapp/api/v1/notes/${id}`,
        success: function (response) {
            const updatedAt = dayjs(response.updatedAt).format('DD MMMM YYYY hh:mm:ss');
            const dateContainer = $('.update_date .date');
            dateContainer.html(updatedAt)
            const titleContainer = $('#note_edit .note .title');
            titleContainer.val(response.title);
            const editor = $('#editor');
            editor.data('id', response.id);
            editor.html(response.text);

            ClassicEditor
                .create(editor[0])
                .catch(error => {
                    console.error(error);
                })
                .then(function (editor) {
                    ckEditor.editorInstance = editor
                });
        },
        error: function (error) {
            console.log(error);
        }
    });
}

//(6) save update note
function saveNote(note) {
    note.updatedAt = dayjs.utc().format();
    $.ajax({
        type: "PUT",
        data: note,
        url: `https://62ff4cf39350a1e548db8783.mockapi.io/noteapp/api/v1/notes/${note.id}`,
        success: function (response) {
            updateDate(response.updatedAt)
            updateNoteInMenu(response)
        },
        error: function (error) {
            console.log(error);
        }
    });
}

function updateNoteInMenu(data) {
    const fakeElement = $('<div></div>').append(data.text)
    const text = fakeElement.text().slice(0, 30) + '...'

    $('.notes-menu__list__item.active .title').html(data.title)
    $('.notes-menu__list__item.active .text').text(text)
    $('.notes-menu__list__item.active .date').text(dayjs(data.updatedAt).format('DD MMMM YYYY'))
}

function updateNote() {
    const note = {
        id: $('#editor').data('id'),
        text: $('#note_edit .note .ck-editor__main .ck-content').html(),
        title: $('#note_edit .note .title').val()
    }

    clearTimeout(timout)

    timout = setTimeout(function () {
        saveNote(note);
    }, 1000);
}

function updateDate(date) {
    $('.update_date .date').text(dayjs(date).format('DD MMMM YYYY hh:mm:ss'))
}