function addNote(note, context) {
    addAction({
        type: "add_note",
        note: note
    }, context);
}

function doneNote(id, context){
    addAction({
        type: "done_note",
        id: id
    }, context);
}

function deleteNote(id, context){
    addAction({
        type: "delete_note",
        id: id
    }, context);
}

function selectCategory(category, context) {
    var mapping = {
        'еда': 'food',
        'фильмы': 'movies',
        'игры': 'games',
        'музыка': 'music',
        'спорт': 'sport',
        'путешествия': 'travel',
        'технологии': 'tech',
        'авто': 'auto'
    };
    var key = category && category.trim().toLowerCase();
    var categoryId = mapping[key] || key;
    addAction({
        type: "select_category",
        categoryId: categoryId
    }, context);
}

function selectLeft(context){
    addAction({
        type: "select_left"
    }, context);
}

function selectRight(context){
    addAction({
        type: "select_right"
    }, context);
}
