var fs = require('fs');

//DOS DEFINTIONS
const DOS_OFFSET_e_lfanew               = 0x3C;
const DOS_OFFSET_SIGNATURE              = 0x0;

const DOS_CONST_SIGNATURE               = 0x4D5A;

//NT DEFINITIONS
const NT_OFFSET_NUMSECTIONS             = 0x6;
const NT_OFFSET_SIGNATURE               = 0x0;
const NT_OFFSET_DEBUG_DIRECTORY         = 0xB8;

const NT_CONST_SIGNATURE                = 0x50450000;

//SECTION DEFINTION
const SECTION_OFFSET                    = 0x1D0;
const SECTION_OFFSET_NAME               = 0x0;
const SECTION_OFFSET_VIRTUAL_SIZE       = 0x0;
const SECTION_OFFSET_VIRTUAL_ADDRESS    = 0x0;
const SECTION_RAW_SIZE                  = 0x0;
const SECTION_RAW_ADDRESS               = 0x0;
const SECTION_RELOC_ADDRESS             = 0x0;
const SECTION_LINENUMBERS               = 0x0;
const SECTION_RELOCATION_NUMBERS        = 0x0;
const SECTION_LINENUMBERS_NUMBER        = 0x0;
const SECTION_CHARACERISTICS            = 0x0;

exports.removePDB = function(path) {
    var binary;
    var dos;
    var nt;
    var sections;

    binary = fs.readFileSync(path);
    dos = readDOSHeader(binary);

    if(dos.SIGNATURE != DOS_CONST_SIGNATURE){
        throw new Error('invalid dos header');
    } 

    nt = readNTHeader(binary, dos);

    if(nt.SIGNATURE != NT_CONST_SIGNATURE) {
        throw new Error('invalid nt header');
    }

    console.log(nt.NUMBER_OF_SECTIONS);
    console.log(nt.DEBUG_DIRECTORY);

    sections = readSectionHeader(binary, nt);
    console.log(sections.test);

    getSection(binary, nt, '.text\0\0\0');
}

function readDOSHeader(binary) {
    return {
        SIGNATURE: binary.readUInt16BE(DOS_OFFSET_SIGNATURE),
        E_LFANEW: binary.readUInt32LE(DOS_OFFSET_e_lfanew)
    };
}

function readNTHeader(binary, dos) {
    return {
        SIGNATURE:              binary.readUInt32BE(dos.E_LFANEW + NT_OFFSET_SIGNATURE),
        NUMBER_OF_SECTIONS:     binary.readUInt16LE(dos.E_LFANEW + NT_OFFSET_NUMSECTIONS),

        /* Data Directories */
        DEBUG_DIRECTORY:        binary.readUInt32LE(dos.E_LFANEW + NT_OFFSET_DEBUG_DIRECTORY)
    }
}

function readSectionHeader(binary, nt) {
    return {
        test: binary.toString('ascii', SECTION_OFFSET, SECTION_OFFSET + 8)
    }
}

function getSection(binary, nt, name) {
    var sectionName = binary.toString('ascii', SECTION_OFFSET, SECTION_OFFSET + 8);

    if(sectionName.trim() === name) {
        return {

        }
    }
}