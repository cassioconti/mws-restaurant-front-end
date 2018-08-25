const toastr = require('toastr');

class ToastrHandler {
    constructor() {
        toastr.options.positionClass = 'toast-top-center';
        toastr.options.preventDuplicates = true;
    }

    notify(message) {
        toastr.info(message);
    }
}

module.exports = ToastrHandler;