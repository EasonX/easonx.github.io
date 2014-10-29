$(function() {
    // allow tab key to be used in the text area
    $('#inputarea').keydown(function(e) {
        // http://stackoverflow.com/questions/1738808/keypress-in-jquery-press-tab-inside-textarea-when-editing-an-existing-text/1738888#1738888
        if (e.keyCode == 9) {
            var myValue = "\t";
            var startPos = this.selectionStart;
            var endPos = this.selectionEnd;
            var scrollTop = this.scrollTop;
            this.value = this.value.substring(0, startPos) + myValue + this.value.substring(endPos, this.value.length);
            this.focus();
            this.selectionStart = startPos + myValue.length;
            this.selectionEnd = startPos + myValue.length;
            this.scrollTop = scrollTop;

            e.preventDefault();
        }
    });
});

function createTable(){
    var cTL, cTM, cTR;
    var cML, cMM, cMR;
    var cBL, cBM, cBR;
    var cH, cV;

    var style = $('#style').val();

    var headerStyle=true;
    var autoFormat = true;
    var hasHeaders = true;
    var spreadSheetStyle = false;

    input_text=$('#inputarea').val();
    var rows = input_text.split(/[\r\n]+/);    
    if (rows[rows.length - 1] == "") {
        rows.pop();
    }

    // calculate the max size of each column
    var colLengths = [];
    var isNumberCol = [];
    for (var i = 0; i < rows.length; i++) {
        var cols = rows[i].split(/\t/);
        for (var j = 0; j < cols.length; j++) {
            var data = cols[j];
            var isNewCol = colLengths[j] == undefined;
            if (isNewCol) {
                isNumberCol[j] = true;
            }
            // keep track of which columns are numbers only
            if ( i == 0 ) {
                 ; // a header is allowed to not be a number (exclude spreadsheet because the header hasn't been added yet
            } else if (isNumberCol[j] && !data.match(/^(\s*-?\d+\s*|\s*)$/)) {
                isNumberCol[j] = false;
            }
            if (isNewCol || colLengths[j] < data.length) {
               colLengths[j] = data.length;
            }
        }
    }

    switch(style) {
        case 'mm':
            //multi markdown
            cTL = "|";
            cTM = "|";
            cTR = "|";
            cML = "|";
            cMM = "|";
            cMR = "|";
            cBL = "|";
            cBM = "|";
            cBR = "|";
            cH = "-";
            cV = "|";
            break;
        case 'mysql':
             // mysql
            cTL = "+";
            cTM = "+";
            cTR = "+";
            cML = "+";
            cMM = "+";
            cMR = "+";
            cBL = "+";
            cBM = "+";
            cBR = "+";
            cH = "-";
            cV = "|";
            break;
        case 'pandoc':
            cTL = " ";
            cTM = "-";
            cTR = " ";
            cML = " ";
            cMM = " ";
            cMR = " ";
            cBL = " ";
            cBM = "-";
            cBR = " ";
            cH = "-";
            cV = " ";
            break;
        case 'html':
            outputAsNormalTable(rows, hasHeaders, colLengths);
            return;        
    };

    // output the text
    var output = "";
    for (var i = 0; i < rows.length; i++) {
        // output the top most row
        // Ex: +---+---+
        if (i == 0) {
            if ( (style == "mysql") || (style == "pandoc") ){
            output += cTL;
            for (var j = 0; j < colLengths.length; j++) {
                output += sfu.repeat(cH, colLengths[j] + 2);
                if (j < colLengths.length - 1) {
                    output += cTM;
                }
                else output += cTR;
            }
            output += "\n";
            } 
        }

        // output the header separator row
        // Ex: +---+---+
        if ( i == 1) {
            output += cML;
            for (var j = 0; j < colLengths.length; j++) {
                output += sfu.repeat(cH, colLengths[j] + 2);
                if (j < colLengths.length - 1) {
                    output += cMM;
                }
                else {
                    output += cMR;
                }
            }
            output += "\n";
        }

        // output the data
        output += cV;
        var cols = rows[i].split(/\t/);
        for (var j = 0; j < colLengths.length; j++) {
            var data = cols[j] || "";
            var align = "l";
            if ( i == 0) {
                align = "c";
            } else if (isNumberCol[j]) {
                align = "r";
            }
            data = sfu.pad(data, colLengths[j], " ", align);
            output += " " + data + " " + cV;
        }
        output += "\n";
        if ( ( style=="pandoc" ) && ( i>=1 ) && ( i< rows.length-1 ) ){
            output += "\n";
        }
        // output the bottom row
        // Ex: +---+---+
        if (i == rows.length - 1) {
            output += cBL;
            for (var j = 0; j < colLengths.length; j++) {
                output += sfu.repeat(cH, colLengths[j] + 2);
                if (j < colLengths.length - 1) output += cBM;
                else output += cBR;
            }
        }
    }
    output_text=output;
    $('#outputarea').val(output_text);
    $('#outputText').show();
    $('#outputTbl').hide();
};

function outputAsNormalTable(rows, hasHeaders, colLengths) {
    var output = "";

    var $outputTable = $('<table>');
    for (var i = 0; i < rows.length; i++) {
        var cols = rows[i].split(/\t/);
        var tag = (hasHeaders && i == 0) ? "th" : "td";
        var $row = $('<tr>').appendTo($outputTable);
        for (var j = 0; j < colLengths.length; j++) {
            var data = cols[j] || " ";
            var $cell = $('<' + tag + '>').text(data);
            $row.append($cell);
        }
    }
    var $outputDiv = $('#outputTbl');
    $outputDiv.empty();
    $outputDiv.append($outputTable);
    $('#outputText').hide();
    $('#outputTbl').show();
};

function parseTableClick() {
    var result = parseTable($('#outputarea').val());
    $('#inputarea').val(result);
};

function parseTable(table) {
    var lines = table.split('\n');
    var style = $('#style').val();

    if ( style == 'pandoc' ){
        lines.pop();
        lines.shift();
    }

    // first find a seprator line
    var separatorLine = '';

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (isSepratorLine(line)) {
            separatorLine = line;
            break;
        }
    }
    
    if (separatorLine == '') {
        alert('Error: make sure to include separator lines.');
        return;
    }
    
    // next, find all column indexes
    var colIndexes = [];
    var horizLineChar = separatorLine[1]; // 2nd char is always the repeating char
    for (var i = 0; i < separatorLine.length; i++) {
        var char = separatorLine[i];
        if (char != horizLineChar) {
            colIndexes.push(i);
        }
    }
    
    // finally, loop over all items and extract the data
    var result = "";
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (isSepratorLine(line)) {
            continue;
        }
        if (line.match(/^$/) ) {
            continue;
        }
        
        for (var j = 0; j < colIndexes.length - 1; j++) {
            var fromCol = colIndexes[j] + 1;
            var toCol = colIndexes[j+1];
            var data = line.slice(fromCol, toCol);
            data = sfu.trim(data);
            result += data;
            
            if (j < colIndexes.length - 2)
                result += '\t';
        }
                
        if (i < lines.length - 1)
            result += '\n';
    }

    return result;
};

function isSepratorLine(line) {
    var style = $('#style').val();
    if (style == "mysql" )
        return line.indexOf(" ") == -1; // must not have spaces
    else if ( style == "mm" ){
        if ( line.match(/^[|-]+$/) ) 
            return true ;
        else 
            return false;
    }
    else if ( style == "pandoc" ) {
        if ( line.match(/^[\ -]+$/) ) 
            return true ;
        else 
            return false;
    }
    else return false;
};
