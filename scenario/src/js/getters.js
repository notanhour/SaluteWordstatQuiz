function get_request(context) {
    if (context && context.request)
        return context.request.rawRequest;
    return {};
}

function get_screen(request) {
    if (request &&
        request.payload &&
        request.payload.meta &&
        request.payload.meta.current_app &&
        request.payload.meta.current_app.state) {
        return request.payload.meta.current_app.state.screen;
    }
    return "";
}
