console.log("ok");


var globalData = {};

var ruleTypes = [
    "all", "cc"
];

function update(mainData, allElements) {

    var spheres = mainData.spheres;

    for (var index in allElements) {
        var elem = allElements[index];
        var key = elem.java.pack + "/" + elem.java.className;
        var sphere = spheres[key];
        sphere.setAttribute("position", elem.coords.x + " " + elem.coords.y + " " + elem.coords.z);

    }
}

function fixCol(aCol) {
    var col = "0" + aCol;
    return col.substring(col.length - 2, col.length);
}

function main() {

    fetch("services/code").then(function (response) {
        response.text().then(function (value) {

            var mainElement = document.getElementById("scene");
            var allElements = JSON.parse(value);
            var spheres = {};
            var codes = {};
            var mainData = {
                spheres: spheres,
                codes: codes,
                edited: false,
                editedCnt: 0,
                displayedRules: "all"
            };

            globalData = mainData;

            mainData.originElements = allElements;

            setKeyboard(mainData);
            for (var index in allElements) {
                var elem = allElements[index];

                if (index) {

                    var entity = document.createElement("a-entity");
                    entity.setAttribute("position", elem.coords.x + " " + elem.coords.y + " " + elem.coords.z);
                    var size = elem.java.size;
                    size = Math.max(20, size);
                    var scaleFact = (Math.log(size / 20) + 0.1) / 20;


                    var sphere = document.createElement("a-plane");
                    sphere.myIndex = index;
                    sphere.myCode = elem.java;
                    sphere.className = "code";

                    setSphereColor(elem, sphere);


                    var subEntity = document.createElement("a-entity");
                    subEntity.setAttribute("look-at", "[camera]");
                    subEntity.setAttribute("scale", scaleFact + " " + scaleFact + " " + scaleFact);
                    subEntity.appendChild(sphere);
                    var classText = document.createElement("a-text");
                    classText.setAttribute('value', elem.java.className);
                    classText.setAttribute('position', '0.5 0.0 2.0');
                    //text.setAttribute('geometry', elem.java.className);
                    subEntity.appendChild(classText);
                    var packageText = document.createElement("a-text");
                    packageText.setAttribute('value', elem.java.pack);
                    packageText.setAttribute('scale', '0.8');
                    packageText.setAttribute('position', '0.4 0.5 2.0');
                    //text.setAttribute('geometry', elem.java.className)
                    subEntity.appendChild(packageText);

                    entity.appendChild(subEntity);
                    spheres[elem.java.pack + "/" + elem.java.className] = entity;
                    codes[elem.java.pack + "/" + elem.java.className] = sphere;
                    mainElement.appendChild(entity);


                }
            }

            setTimeout(function () {

                setInterval(function () {
                    fetch("services/updated").then(function (updatedResponse) {
                        updatedResponse.text().then(function (upd) {
                            update(mainData, JSON.parse(upd));
                        });

                    });
                }, 10000);
            }, 5000);


        });

    });
}


function setKeyboard(mainData) {
    window.onkeyup = function (e) {
        var key = e.keyCode ? e.keyCode : e.which;

        if (key == 188) {
            mainData.edited = true;
            mainData.editedCnt++;

            drawEdit(mainData);
        }
        if (key == 190) {
            mainData.edited = true;
            mainData.editedCnt--;

            drawEdit(mainData);
        }

        if (key == 222) {
            var ruleIndex = ruleTypes.indexOf(globalData.displayedRules);
            ruleIndex = ruleIndex + 1;
            if (ruleIndex >= ruleTypes.length) {
                ruleIndex = 0;
            }
            globalData.displayedRules = ruleTypes[ruleIndex];
            updateSpheres();
        }
        console.log(key);
    }
}


function drawEdit(mainData) {
    if (mainData.edited) {

        var elementData = mainData.originElements[mainData.editedCnt];
        var key = elementData.java.pack + "/" + elementData.java.className;
        var editor = document.getElementById("mainText");
        var fixedCode = fixText(elementData.java.code)
        var violations = violatedText(fixedCode, elementData.java.violations);

        editor.setAttribute("value", violations[0]);
        console.log(elementData.java.violations);
        var editorRed = document.getElementById("redText");
        var editorYel = document.getElementById("yellowText");

        editorRed.setAttribute("value", violations[1]);
        editorYel.setAttribute("value", violations[2]);
        var sphere = mainData.spheres[key];
        /*editor.setAttribute("position", "0.5 0 0");
        editorRed.setAttribute("position", "0.5 0 0");*/
        sphere.appendChild(editor);
        sphere.appendChild(editorRed);
        sphere.appendChild(editorYel);
    }
}

function givenViolation(line, violations) {
    for (var v = 0; v < violations.length; v++) {
        var violation = violations[v];
        if (line >= violation.beginLine && line <= violation.endLine) {
            return violations[v];
        }
    }
    return null;
}


function violatedText(original, violations) {
    var lines = original.split("\n");
    var normResult = "";
    var redResult = "";
    var violResult = "";
    for (var line = 0; line < lines.length; line++) {
        var violation = givenViolation(line, violations);
        if (violation) {
            redResult += lines[line] + "\n";
            normResult += "\n";
            if (violation.beginLine === line) {
                console.log(violation.info);
                violResult += violation.info;
            } else {
                violResult += "\n";
            }
        } else {
            normResult += lines[line] + "\n";
            redResult += "\n";
            violResult += "\n";
        }
    }
    //console.log("red is:\n"+result);
    return [normResult, redResult, violResult];
}


function fixText(original) {
    return original.replace(/\n/g, "\n:");

}

function calcViolation(javaElem, violationType) {
    if (violationType === "cc") {
        var total = 0;
        for (v in javaElem.violations) {
            var violation = javaElem.violations[v];
            var value = violation.value;
            var valueFixed = Math.max(value - 6, 0);
            var valueSQ = valueFixed * valueFixed;
            total += valueSQ;


        }
        var maxViolation = Math.min(30, total);
        return maxViolation / 30.0;
    } else {
        return Math.min(javaElem.violations.length / 10.0, 1.0);
    }
}

function setSphereColor(elem, sphere) {
    var violation = calcViolation(elem.java, globalData.displayedRules);
    var violationCol = Math.round((violation * 255));

    var redLevel = fixCol(violationCol.toString(16));
    var greenLevel = fixCol((255 - violationCol).toString(16));

    sphere.setAttribute("color", '#' + redLevel + '' + greenLevel + '00');
}

function updateSpheres() {
    var codes = globalData.codes;
    for (var e in globalData.originElements) {
        var elem = globalData.originElements[e];
        var key = elem.java.pack + "/" + elem.java.className;
        var codeEntity = codes[key];

        setSphereColor(elem, codeEntity);


    }
}

main();







