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

function selectLeft(context) {
    addAction({
        type: "select_left"
    }, context);
}

function selectRight(context) {
    addAction({
        type: "select_right"
    }, context);
}

function backToMenu(context) {
    addAction({
        type: "back_to_menu"
    }, context);
}

function nextQuestion(context) {
    addAction({
        type: "next_question"
    }, context);
}
