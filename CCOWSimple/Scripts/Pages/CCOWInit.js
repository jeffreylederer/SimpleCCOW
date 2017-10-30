var cmv;

// call back for join
function JoinCallBack(token, statuscode) {
    if (statuscode === Caradigm.IAM.Success) {
        window.location.href = "Main.html";
    } else if (status === Caradigm.IAM.CCOWException.AlreadyJoinedException) {
        window.location.href = "Main.html";
    } else {
        cmv.status('not joined: ' + statuscode.message);
    }
}




// knockout model
var ContextViewModel = function () {
    var self = this;
    // an arrary of context keys and values
    self.status = ko.observable();  // for displaying current status
    self.token = ko.observable(); 
}


$(document).ready(function() {
    Caradigm.LogLevels = Caradigm.IAM.LogLevels.Finest; // log everythibng
    cmv = new ContextViewModel();
    ko.applyBindings(cmv); // bind model
    try {
        var mytoken = Caradigm.IAM.IContextor.JoinAsync("PrintOnDemand#", true, JoinCallBack);
        cmv.token(mytoken.toString());
    } catch (err) {
        cmv.status('not joined, exception: ' + err.message);
    }

});

