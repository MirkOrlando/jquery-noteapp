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
    console.log(data);
}