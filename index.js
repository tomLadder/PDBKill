var fs = require('fs');

//DOS DEFINTIONS
const DOS_OFFSET_e_lfanew           = 0x3C;
const DOS_OFFSET_SIGNATURE          = 0x0;

const DOS_CONST_SIGNATURE           = 0x4D5A;

//NT DEFINITIONS
const NT_OFFSET_NUMSECTIONS         = 0x6;
const NT_OFFSET_SIGNATURE           = 0x0;
const NT_OFFSET_DEBUG_DIRECTORY     = 0xB8;

const NT_CONST_SIGNATURE            = 0x50450000;

//SECTION DEFINTIONS
const SECTION_OFFSET                = 0x1D8;

exports.removePDB = function(path) {
    //read input file
    var dos = fs.readFileSync(path);

    if(dos.readUInt16BE(DOS_OFFSET_SIGNATURE) != DOS_CONST_SIGNATURE){
        throw new Error('invalid dos header');
    } 

    var nt = dos.copyWithin(0, dos.readUInt32LE(DOS_OFFSET_e_lfanew));

    if(nt.readUInt32BE(NT_OFFSET_SIGNATURE) != NT_CONST_SIGNATURE) {
        throw new Error('invalid nt header');
    }

    var sections = dos.copyWithin(0, SECTION_OFFSET);

    console.log(sections);
    
    var rvaDBG = nt.readUInt32LE(NT_OFFSET_DEBUG_DIRECTORY);

    if(rvaDBG = 0) {
        throw new Error('debug directory not found');
    }

    var section = getSection(nt, name);
}

function getSection(sections, name) {
}