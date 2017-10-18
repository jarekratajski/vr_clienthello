/* global AFRAME */

/**
 * Handles events coming from the hand-controls.
 * Determines if the entity is grabbed or released.
 * Updates its position to move along the controller.
 */

var hitIndex = null;


AFRAME.registerComponent('grab', {
    init: function () {
        this.GRABBED_STATE = 'grabbed';
        // Bind event handlers
        this.onHit = this.onHit.bind(this);
        this.onGripOpen = this.onGripOpen.bind(this);
        this.onGripClose = this.onGripClose.bind(this);
        console.log("grabbing init");
    },

    play: function () {
        var el = this.el;
        el.addEventListener('hitstart', this.onHit);
        el.addEventListener('gripclose', this.onGripClose);
        el.addEventListener('gripopen', this.onGripOpen);
        el.addEventListener('thumbup', this.onGripClose);
        el.addEventListener('thumbdown', this.onGripOpen);
        el.addEventListener('pointup', this.onGripClose);
        el.addEventListener('pointdown', this.onGripOpen);
        el.addEventListener('trackpaddown', this.onTrackpad);
    },

    pause: function () {
        var el = this.el;
        el.removeEventListener('hit', this.onHit);
        el.removeEventListener('gripclose', this.onGripClose);
        el.removeEventListener('gripopen', this.onGripOpen);
        el.removeEventListener('thumbup', this.onGripClose);
        el.removeEventListener('thumbdown', this.onGripOpen);
        el.removeEventListener('pointup', this.onGripClose);
        el.removeEventListener('pointdown', this.onGripOpen);
        el.addEventListener('trackpaddown', this.onTrackpadUp);
    },

    onGripClose: function (evt) {
        this.grabbing = true;
        delete this.previousPosition;
        console.log("grip close");
        globalData.edited = true;
        drawEdit(globalData);
            //toVector3 ? (threejs)
    },

    onGripOpen: function (evt) {
        console.log("grip open");
        var hitEl = this.hitEl;
        this.grabbing = false;
        if (!hitEl) { return; }
        hitEl.removeState(this.GRABBED_STATE);
        this.hitEl = undefined;

    },

    onHit: function (evt) {


        var hitEl = evt.detail.intersectedEls[0];
        if (hitEl) {
            console.log("hit:"+hitEl);
            console.log("hitI:"+hitEl.myIndex);
            console.log("hitC:"+hitEl.myCode);
            globalData.editedCnt = hitEl.myIndex;
        }

        // If the element is already grabbed (it could be grabbed by another controller).
        // If the hand is not grabbing the element does not stick.
        // If we're already grabbing something you can't grab again.
        if (!hitEl || hitEl.is(this.GRABBED_STATE) || !this.grabbing || this.hitEl) { return; }
        hitEl.addState(this.GRABBED_STATE);
        this.hitEl = hitEl;
    },

    tick: function () {
        var hitEl = this.hitEl;
        var position;
        if (!hitEl) { return; }
        this.updateDelta();
        position = hitEl.getAttribute('position');
        hitEl.setAttribute('position', {
            x: position.x + this.deltaPosition.x,
            y: position.y + this.deltaPosition.y,
            z: position.z + this.deltaPosition.z
        });
    },

    updateDelta: function () {
        var currentPosition = this.el.getAttribute('position');
        var previousPosition = this.previousPosition || currentPosition;
        var deltaPosition = {
            x: currentPosition.x - previousPosition.x,
            y: currentPosition.y - previousPosition.y,
            z: currentPosition.z - previousPosition.z
        };
        this.previousPosition = currentPosition;
        this.deltaPosition = deltaPosition;
    },

    onTrackpad: function (evt) {
        //console.log("track:"+evt);
        trackpad = evt.currentTarget;

    },
    onTrackpadUp: function (evt) {
        //console.log("track:"+evt);
        trackpad = null;
        speed = 0;
    }

});

var trackpad = null;
var speed = 1.0;


function updateCamera() {
    if (trackpad) {
        var rotation = trackpad.object3D.rotation;
         var axisy = trackpad.components['tracked-controls'].axis[1];
    //console.log(rotation);
    var camera = document.getElementById("cameraRig");
    //console.log("cam:"+ JSON.stringify(camera.object3D.position));
    var pos = camera.object3D.position;
    var scale = -0.1*axisy;





    var x = scale * Math.cos( -rotation._x)* Math.cos(rotation._y);
    var y = scale * Math.cos( -rotation._x)* Math.sin(rotation._y);
    var z = scale * Math.sin( -rotation._x);

    //console.log(x + " #" + y + " # " + z);
    pos.x = pos.x + y;
    pos.y = pos.y + z;
    pos.z = pos.z + x;
    }
}

setInterval( updateCamera, 50);