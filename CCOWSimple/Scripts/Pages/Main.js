var cmv;

/* *****************************

Off channel call backs from Sentiliion windows service

**************************** */

Caradigm.IAM.IContextParticipant =
{
    OnContextChangePending: OnContextChangePending,
    OnContextChangeAccepted: OnContextChangeAccepted,
    OnContextChangeCanceled: OnContextChangeCanceled,
    OnContextTerminated: OnContextTerminated
};

// called when another app starts a context change, returns value indicating this app is ready
function OnContextChangePending (proposedcontextcoupon) {
    cmv.addstatus("Context change pending received");
    return '';
};

// when context change is approved by all apps, this is called. Will get the latest context
function OnContextChangeAccepted(contextcoupon) {
    Caradigm.IAM.IContextor.GetContextAsync(false, onGetContext);
    cmv.addstatus("Context changed received");
};

function OnContextChangeCanceled() {
    cmv.addstatus("Context change cancelled");
};

// context terminated by admin, try rejoining context
function OnContextTerminated() {
    Caradigm.IAM.IContextor.JoinAsync("PrintOnDemand#", true, JoinCallBack);
};


/* *****************************

call backs from IContextor calls

**************************** */


function JoinCallBack(token, statuscode) {
    if (statuscode === Caradigm.IAM.Success) {
        cmv.addstatus("rejoined context");
    } else if (status === Caradigm.IAM.CCOWException.AlreadyJoinedException) {
        cmv.addstatus("tried to rejoined context but already joined");
    } else {
        cmv.addstatus('tried to rejoin context but could not: ' + statuscode.message);
    }
}

function OnLeaveCallBack(token, statuscode) {
    if (statuscode === Caradigm.IAM.Success) {
        window.location.href = "Leave.html";
    } else {
        cmv.addstatus('Failed to Leave Context : ' + statuscode.message);
    }
}

// callback on get context, will display the current context
function onGetContext(token, statuscode, contextitems) {
    if (statuscode !== Caradigm.IAM.Success) {
        cmv.addstatus('error getting context: ' + statuscode.message);
    }
    // else iterate through context_items
    else {
        cmv.addtoarray(contextitems);
        cmv.addstatus('Get Context successful');
    }
}

function setContextCallback(token, statuscode, noContinue, responseList) {
    if (statuscode === Caradigm.IAM.Success) {
        if (noContinue) {
            $.each(responseList,
                    function(index, value) {
                        cmv.addstatus("Reason for not committing: " + value);
                    });
        } else {
            cmv.addstatus('Set Context successful');
            Caradigm.IAM.IContextor.GetContextAsync(false, onGetContext);
        }
    } else {
        cmv.addstatus('error setting context: ' + statuscode.message);
    }
}

function suspendCallback(token, statuscode) {
    if (statuscode !== Caradigm.IAM.Success) {
        cmv.addstatus('error Supending Context: ' + statuscode.message);
    }
    // else iterate through context_items
    else {
        cmv.IsSuspended(true);
        cmv.addstatus('Suspended successful');
    }
}

function resumeCallback(token, statuscode) {
    if (statuscode !== Caradigm.IAM.Success) {
        cmv.addstatus('error Resume Context: ' + statuscode.message);
    }
    // else iterate through context_items
    else {
        cmv.IsSuspended(false);
        cmv.addstatus('Resume successful');
    }
}

/* *****************************

Patient data used in set context

**************************** */


var patientList = [
    {
        'patient.id.mrn.empi': '556147',
        'patient.co.patientname': 'SMITH^JOHN^^^^',
        'patient.id.mrn.ssn': '172385585',
        'patient.id.mrn.medipacnumeric': '784273931',
        'patient.co.sex': 'Male',
        'patient.id.mrn.epic': '841110407',
        'patient.id.mrn.epicnumeric': '841110407',
        'patient.id.mrn.medipac': '784273931',
        'patient.id.mrn.medipacdashes': '784-27-3931',
        'patient.co.datetimeofbirth': '194704170000'
    },
    {
        'patient.id.mrn.empi': '14167522',
        'patient.co.patientname': 'JONES^JANE^^^^',
        'patient.id.mrn.ssn': '186540957',
        'patient.id.mrn.medipacnumeric': '981663142',
        'patient.co.sex': 'Female',
        'patient.id.mrn.epic': '737891347',
        'patient.id.mrn.epicnumeric': '737891347',
        'patient.id.mrn.medipac': '981663142',
        'patient.id.mrn.medipacdashes': '981-66-3142',
        'patient.co.datetimeofbirth': '196411180000'
    }
];


// knockout view model
var ContextViewModel = function () {
    var self = this;

    self.Patients = 
        ko.observableArray([
        { patientname: 'Smith, John', patientid: 0 },
        { patientname: 'Jones, Jane', patientid: 1 }
        ]);

    self.selectedPatient = ko.observable();  // value used by patient select control for value
    self.IsSuspended = ko.observable(false);

    // text in change context button
    self.SuspendedText = ko.computed(function() {
        if (self.IsSuspended()) {
            return "Resume Context";
        } else {
            return "Suspend Context";
        }
    });
    self.context = ko.observableArray();  // an arrary of context keys and values
    self.status = ko.observableArray();  // for displaying status log

    // fills the context observable array from context sent from sentillion
    self.addtoarray = function(assoc) {
        self.context.removeAll();
        for (var key in assoc) {
            if (assoc.hasOwnProperty(key)) {
                self.context.push(
                    { contextvalue: assoc[key], contextname: key });
            }
        }
    }.bind(self);


    // records status for each event
    self.addstatus = function (newstatus) {
        self.status.push(newstatus);
    }.bind(self);


    // called by change selection event
    self.SetContext = function() {
        if (self.selectedPatient()) {
            var index = self.selectedPatient().patientid;
            var list = patientList[index];
            try {
                Caradigm.IAM.IContextor.SetContextAsync(list, true, setContextCallback);
            } catch (err) {
                cmv.addstatus("Set context exception: " + err.message);
            }
        }
    };

    // call by button click: Leave Context
    self.Leave = function() {
        Caradigm.IAM.IContextor.LeaveAsync(OnLeaveCallBack);
    };

    // called by button click event: Suspend or Resume Context
    self.Resume = function() {
        if (self.IsSuspended()) {
            Caradigm.IAM.IContextor.ResumeAsync(resumeCallback);
        } else {
            Caradigm.IAM.IContextor.SuspendAsync(suspendCallback);
        }
    }; 
}


$(document).ready(function() {
    Caradigm.LogLevels = Caradigm.IAM.LogLevels.Finest; // log everything
    cmv = new ContextViewModel();
    ko.applyBindings(cmv); // bind model
    // get context
    try {
        Caradigm.IAM.IContextor.GetContextAsync(false, onGetContext);
    }
    catch(err)
    {
        cmv.addstatus("Get context exception: " + err.message);
    }
});