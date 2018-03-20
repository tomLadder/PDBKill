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
const SECTION_OFFSET                            = 0x1D0;
const SECTION_HEADER_ENTRY_SIZE                 = 0x28;
const SECTION_OFFSET_NAME                       = 0x0;
const SECTION_OFFSET_VIRTUAL_SIZE               = 0x8;
const SECTION_OFFSET_VIRTUAL_ADDRESS            = 0xC;
const SECTION_OFFSET_RAW_SIZE                   = 0x10;
const SECTION_OFFSET_RAW_ADDRESS                = 0x14;
const SECTION_OFFSET_RELOC_ADDRESS              = 0x18;
const SECTION_OFFSET_LINENUMBERS                = 0x1C;
const SECTION_OFFSET_RELOCATION_NUMBERS         = 0x20;
const SECTION_OFFSET_LINENUMBERS_NUMBER         = 0x22;
const SECTION_OFFSET_CHARACERISTICS             = 0x24;

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

    var sections = getSections(binary, nt);

    sections.forEach(section => {
        console.log(JSON.stringify(section));
    });
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

function getSections(binary, nt) {
    var sections = new Array();

    for(var i=0;i<nt.NUMBER_OF_SECTIONS;i++) {
        sections.push(readSectionFromBinary(binary, i));
    }

    return sections;
}

function getSection(binary, nt, name) {
    for(var i=0;i<nt.NUMBER_OF_SECTIONS;i++) {
        var sectionName = binary.toString('ascii', SECTION_OFFSET + SECTION_HEADER_ENTRY_SIZE*i, SECTION_OFFSET +SECTION_HEADER_ENTRY_SIZE*i + 8);

        if(sectionName === name)
            return readSectionFromBinary(binary, i);
    }

    return undefined;
}

function readSectionFromBinary(binary, idx) {
    return {
        NAME:                   binary.toString('ascii', SECTION_OFFSET + SECTION_HEADER_ENTRY_SIZE*idx, SECTION_OFFSET + SECTION_HEADER_ENTRY_SIZE*idx + 8),
        VIRTUAL_SIZE:           binary.readUInt32LE(SECTION_OFFSET + SECTION_HEADER_ENTRY_SIZE*idx + SECTION_OFFSET_VIRTUAL_SIZE),
        VIRTUAL_ADDRESS:        binary.readUInt32LE(SECTION_OFFSET + SECTION_HEADER_ENTRY_SIZE*idx + SECTION_OFFSET_VIRTUAL_ADDRESS),
        RAW_SIZE:               binary.readUInt32LE(SECTION_OFFSET + SECTION_HEADER_ENTRY_SIZE*idx + SECTION_OFFSET_RAW_SIZE),
        RAW_ADDRESS:            binary.readUInt32LE(SECTION_OFFSET + SECTION_HEADER_ENTRY_SIZE*idx + SECTION_OFFSET_RAW_ADDRESS),
        RELOC_ADDRESS:          binary.readUInt32LE(SECTION_OFFSET + SECTION_HEADER_ENTRY_SIZE*idx + SECTION_OFFSET_RELOC_ADDRESS),
        LINENUMBERS:            binary.readUInt32LE(SECTION_OFFSET + SECTION_HEADER_ENTRY_SIZE*idx + SECTION_OFFSET_LINENUMBERS),
        RELOCATIONS_NUMBER:     binary.readUInt16LE(SECTION_OFFSET + SECTION_HEADER_ENTRY_SIZE*idx + SECTION_OFFSET_RELOCATION_NUMBERS),
        LINENUMBERS_NUMBER:     binary.readUInt16LE(SECTION_OFFSET + SECTION_HEADER_ENTRY_SIZE*idx + SECTION_OFFSET_LINENUMBERS_NUMBER),
        CHARACTERISTICS:        binary.readUInt32LE(SECTION_OFFSET + SECTION_HEADER_ENTRY_SIZE*idx + SECTION_OFFSET_CHARACERISTICS)
    } 
}