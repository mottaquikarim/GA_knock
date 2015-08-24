// singleton implementation of a routehandler
var Routes = require('./Routes/router');
var $ = require('jquery');
var Firebase = require('firebase');

// register routes
Routes.register( '/home', function() {
    var $row = $('<div class="value-props row" style="margin-top: 0;"/>'),
        $col = $('<div class="four columns value-prop value--centeralign" style="width:100%;margin:0 auto;float:none;"/>'),
        $shim = $('<div class="value-prop__shim value-prop__shim--hide"/>'),
        $a = $('<a class="value-prop-anch" style="cursor: pointer;" id="knock"/>'),
        $img = $('<img src="assets/unlock.svg" class="value-img"/>');

    $a.append( $img );
    $a.append('<h1>Knock!</h1>');
    $col.append( $shim );
    $col.append( $a );
    $row.append( $col );

    $('.data').empty()
        .append( '<p class="desc">This app will notify someone at frontlines that you are at the door. Tap <b>Knock!</b> to get started!</p>' ) 
        .append( $row );

    var myFirebaseRef = new Firebase('https://knockknockga.firebaseio.com/');

    var isKnock = false;
    $('#knock').on('click', function() {
        if ( isKnock ) return;
        isKnock = true;
        myFirebaseRef.set({
            request: 1
        });
        $( this ).find('h1').text('Knocked!');
        $( this ).parent().find('.value-prop__shim').removeClass('value-prop__shim--hide');
    });

    myFirebaseRef.child('broadcast').on('value', function(snapshot) {
        var val = snapshot.val();

        if ( val === null ) return;

        if ( typeof val.hasResponded === "undefined" ) return;

        if ( val.hasResponded === 1 ) {
            myFirebaseRef.child('broadcast').remove();
            $('.desc').html('<b>HELP IS ON THE WAY!</b> Someone has seen your knock and interacted with the generated notification!');
        };
    });
});

Routes.register( '/login', function() {
    $('.data').empty()
        .append(
            '<p>Please login before continuing.</p>'
        )
        .append(
            '<input type="password" placeholder="Password?" class="pw"/>'
        )
        .append(
            '<div><input type="button" value="Log in" class="button button-primary login"></div>'
        );

     $('.login').on('click', function() {
        var pw = $('.pw').val();

        var myFirebaseRef = new Firebase('https://knockknockga.firebaseio.com/');
        myFirebaseRef.authWithPassword({
            "email": "frontlines@ga.co",
            "password": pw 
        }, function(error, authData) {
            if (error) {
                alert('Login failed! Did you get the password right?');
                $('.pw').val('');
                console.log("Login Failed!", error);
            } else {
                Routes.setRoute('notify');
            }
        });

     });
});

Routes.register( '/about', function() {

    $('.data').empty()
        .append('<p>This tool allows for folks who are locked out of GA NYC during weekend hours, etc to communicate with frontlines staff without the need for any personal information. Just knock!</p>');
});

Routes.register( '/notify', function() {

    var myFirebaseRef = new Firebase('https://knockknockga.firebaseio.com/');
    
    var authData = myFirebaseRef.getAuth();

    if ( !authData ) {
        Routes.setRoute('login');
    }

    notifyMe(); 
    
    var $row = $('<div class="value-props row" style="margin-top: 0;"/>'),
        $col = $('<div class="four columns value-prop value--centeralign" style="width:100%;margin:0 auto;float:none;"/>'),
        $shim = $('<div class="value-prop__shim value-prop__shim--hide"/>'),
        $a = $('<a class="value-prop-anch" style="cursor: pointer;" id="knock"/>'),
        $img = $('<img src="assets/loading.svg" class="value-img rotate"/>');

    $a.append( $img );
    $a.append('<h1>Watching and waiting...</h1>');
    $col.append( $shim );
    $col.append( $a );
    $row.append( $col );

    $('.data').empty()
        .append( '<p><b>Keep this page open!</b> You will be notified when someone is at the door. Feel free to tab away, you will get a <b>desktop notification</b> when someone\'s at the door.</p>' ) 
        .append( $row );


    myFirebaseRef.on('value', function(snapshot) {
        var val = snapshot.val();
        if ( val === null ) return;

        if ( val.request === 1 ) {
            var notif = notifyMe('Knock Knock!'); 

            notif.onshow = function() {
                setTimeout(function() {
                    notif.close();
                }, 5000);
            };

            notif.onclick = function() {
                myFirebaseRef.child('broadcast').set({
                    hasResponded: 1
                });
            };

            myFirebaseRef.set({
                request: 0
            });
        }

    });
});

function notifyMe( val ) {
  // Let's check if the browser supports notifications
  if (!("Notification" in window)) {
    alert("This browser does not support desktop notification");
  }

  // Let's check whether notification permissions have already been granted
  else if (Notification.permission === "granted") {
    // If it's okay let's create a notification
    if ( typeof val === "undefined" ) return;
    var notification = new Notification(val, {
        body: 'Someon\'s at the door! Click here to let this person know you are on your way.',
        icon: '/assets/alert.png'
    });

    return notification;
  }

  // Otherwise, we need to ask the user for permission
  else if (Notification.permission !== 'denied') {
    Notification.requestPermission(function (permission) {
      // If the user accepts, let's create a notification
    });
  }

  // At last, if the user has denied notifications, and you 
  // want to be respectful there is no need to bother them any more.
}

// set default route
Routes.init( 'home' );
