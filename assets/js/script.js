const ckEditor = {
    editorInstance: {}
}

let timout = null;

$(document).ready(function () {
    dayjs.locale('it')
    dayjs.extend(window.dayjs_plugin_utc);

    getAllNotes('updatedAt', 'desc');

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

    // dropdown
    $(document).on('click', '#filter', function (e) {
        dropdown($(this))
    })

    $(document).on('click', '#sort', function (e) {
        dropdown($(this))
    })

    $(document).on('click', '#layout', function (e) {
        dropdown($(this))
    })

    // sort order
    $(document).on('click', '.dropdown[data-id="sort"] a.btn--text', function (e) {
        e.preventDefault();
        if (ckEditor.editorInstance.id) {
            ckEditor.editorInstance.destroy();
            ckEditor.editorInstance = {};
        }

        $(this).parent('li').addClass('active').siblings().removeClass('active');

        const sort = $(this).data('sort');
        const order = $(this).prev('a').data('order')
        console.log(sort, order);

        getAllNotes(sort, order)
    })

    $(document).on('click', '.dropdown[data-id="sort"] a.btn--svg', function (e) {
        e.preventDefault();
        if (ckEditor.editorInstance.id) {
            ckEditor.editorInstance.destroy();
            ckEditor.editorInstance = {};
        }

        $(this).parent('li').addClass('active').siblings().removeClass('active');

        const sort = $(this).next('a').data('sort');
        const order = $(this).data('order');
        console.log(sort, order);


        getAllNotes(sort, order);

        if (order === 'asc') {
            $(this).data('order', 'desc').addClass('rotate');
        } else if (order === 'desc') {
            $(this).data('order', 'asc').removeClass('rotate');
        }
    })

    //(10) change layout
    $(document).on('click', '.dropdown[data-id="layout"] li.dropdown__list__item', function (event) {
        const layout = $(this).data('layout');

        $(this).addClass('active').siblings().removeClass('active');

        $('.notes_list_main').removeClass('fragment list').addClass(layout);

        $(this).parents('.dropdown').removeClass('active')
    })
});

// (1) API Ajax
function getAllNotes(sort, order) {
    $.ajax({
        type: "GET",
        url: `https://62ff4cf39350a1e548db8783.mockapi.io/noteapp/api/v1/notes?sortBy=${sort}&order=${order}`,
        success: function (response) {
            if (response.length > 0) {
                printListNotes(response, sort)
            }
        },
        error: function (error) {
            console.log(error);
        }
    });
}

function printListNotes(data, sort) {
    //Handlebars
    const listYearsContainer = $('#notes_list .notes_list_main .notes_container');
    listYearsContainer.html('')
    const source = $('#note-year').html();
    const template = Handlebars.compile(source)

    //get available years
    const years = [];
    data.forEach(note => {
        const year = dayjs(note[sort]).format('YYYY');
        if (!years.includes(year)) {
            years.push(year)
        }
    });

    //print for years
    years.forEach(function (year) {
        const html = template({ year });
        listYearsContainer.append(html)

        const notesFiltered = data.filter(function (note) {
            return dayjs(note[sort]).format('YYYY')
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
            const updatedAt = dayjs(response.updatedAt).format('DD MMMM YYYY HH:mm:ss');
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

            // message saved add
            const footerMessageContainer = $('footer.details .status').html('Tutte le modifiche sono state salvate');

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
    // message saved add
    const footerMessageContainer = $('footer.details .status').html('...');

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
    $('.update_date .date').text(dayjs(date).format('DD MMMM YYYY HH:mm:ss'))
}

function dropdown(element) {
    const offset = element.offset();
    const height = element.height();

    const id = element.attr('id');
    const dropdown = $(`.dropdown[data-id="${id}"`);

    dropdown.siblings().removeClass('active');

    dropdown.toggleClass('active').css({ top: offset.top + height, left: offset.left });
}