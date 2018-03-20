var fs = require('fs');

//DOS DEFINTIONS
const DOS_OFFSET_e_lfanew               = 0x3C;
const DOS_OFFSET_SIGNATURE              = 0x0;

const DOS_CONST_SIGNATURE               = 0x4D5A;

//NT DEFINITIONS
const NT_OFFSET_NUMSECTIONS             = 0x6;
const NT_OFFSET_SIGNATURE               = 0x0;
const NT_OFFSET_DEBUG_DIRECTORY         = 0xB8;
const NT_OFFSET_DEBUG_DIRECTORY_SIZE    = 0xBC

const NT_CONST_SIGNATURE                = 0x50450000;

//SECTION DEFINTION
const SECTION_OFFSET                            = 0x1E8;
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

//DEBUG DIRECTORY DEFINITIONS
const DEBUG_ENTRY_SIZE                                 = 0x54;

const DEBUG_OFFSET_CHARACTERISTICS                     = 0x0;
const DEBUG_OFFSET_TIMEDATESTAMP                       = 0x4;
const DEBUG_OFFSET_MAJORVERSION                        = 0x8;
const DEBUG_OFFSET_MINORVERSION                        = 0xA;
const DEBUG_OFFSET_TYPE                                = 0xC;
const DEBUG_OFFSET_SIZEOFDATA                          = 0x10;
const DEBUG_OFFSET_ADDRESSOFRAWDATA                    = 0x14;
const DEBUG_OFFSET_POINTERTORAWDATA                    = 0x18;

//IMAGE_DEBUG_TYPE_CODEVIEW DEFINTIONS
const IMAGE_DEBUG_TYPE_CODEVIEW                        = 0x2;

const DEBUG_CODEVIEW_PDB7_OFFSET_CVSIGNATURE           = 0x0;
const DEBUG_CODEVIEW_PDB7_OFFSET_GUID                  = 0x4;
const DEBUG_CODEVIEW_PDB7_OFFSET_AGE                   = 0x14;
const DEBUG_CODEVIEW_PDB7_OFFSET_FILENAME              = 0x18;

const DEBUG_CONST_CVSIGNATURE                          = 0x52534453; //RSDS

exports.removePDB = function(path, resultname) {
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

    var dbgCODEVIEW = getDebugDirectoryEntries(binary, nt).find((element) => {
        return element.TYPE === IMAGE_DEBUG_TYPE_CODEVIEW;
    });

    if(dbgCODEVIEW == undefined)
        throw new Error('no IMAGE_DEBUG_TYPE_CODEVIEW found');

    var info = readCV_INFO_PDB70FromBinary(binary, dbgCODEVIEW.POINTERTORAWDATA);

    if(info === undefined || info.CVSIGNATURE !== DEBUG_CONST_CVSIGNATURE)
        throw new Error('no CV_INFO_PDB70 found');

    //remove pdb file path
    var curChar = -1;
    var i = 0;

    while(curChar !== 0) {
        curChar = binary.readInt8(dbgCODEVIEW.POINTERTORAWDATA + DEBUG_CODEVIEW_PDB7_OFFSET_FILENAME + i);

        if(curChar !== 0) {
            binary.writeInt8(0, dbgCODEVIEW.POINTERTORAWDATA +  DEBUG_CODEVIEW_PDB7_OFFSET_FILENAME + i);
            i++;
        }
    }

    console.log('erased ' + i + ' characters');

    /* save modified binary */
    fs.writeFile(resultname, binary, (err) => {
        if(err)
            throw err;

        console.log('binary saved to ' + resultname);
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
        DEBUG_DIRECTORY:        binary.readUInt32LE(dos.E_LFANEW + NT_OFFSET_DEBUG_DIRECTORY),
        DEBUG_DIRECTORY_SIZE:   binary.readUInt32LE(dos.E_LFANEW + NT_OFFSET_DEBUG_DIRECTORY_SIZE)
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

function getDebugDirectoryEntries(binary, nt) {
    var entries = new Array();

    //find section of DEBUG_DIRECTORY to get file offset
    var section = getSections(binary, nt).find((element) => {
        return (nt.DEBUG_DIRECTORY >= element.VIRTUAL_ADDRESS) && (nt.DEBUG_DIRECTORY <= (element.VIRTUAL_ADDRESS + element.VIRTUAL_SIZE));
    });

    var fileOffset = (nt.DEBUG_DIRECTORY - section.VIRTUAL_ADDRESS) + section.RAW_ADDRESS;

    //seems to be buggy
    //var cnt = nt.DEBUG_DIRECTORY_SIZE / DEBUG_ENTRY_SIZE;
    var cnt = 1;

    if(!Number.isInteger(cnt))
        throw new Error('cannot get a valid debugentry count - pe invalid');

    for (var i=0;i<cnt;i++) {
        entries.push(readDebugDirectoryEntiryFromBinary(binary, fileOffset + DEBUG_ENTRY_SIZE*i));
    }

    return entries;
}

function readDebugDirectoryEntiryFromBinary(binary, offset) {
    return {
        CHARACTERISTICS:            binary.readUInt32LE(offset + DEBUG_OFFSET_CHARACTERISTICS),
        TIMEDATESTAMP:              binary.readUInt32LE(offset + DEBUG_OFFSET_TIMEDATESTAMP),
        MAJORVERSION:               binary.readUInt16LE(offset + DEBUG_OFFSET_MAJORVERSION),
        MINORVERSION:               binary.readUInt16LE(offset + DEBUG_OFFSET_MINORVERSION),
        TYPE:                       binary.readUInt32LE(offset + DEBUG_OFFSET_TYPE),
        SIZEOFDATA:                 binary.readUInt32LE(offset + DEBUG_OFFSET_SIZEOFDATA),
        ADDRESSOFRAWDATA:           binary.readUInt32LE(offset + DEBUG_OFFSET_ADDRESSOFRAWDATA),
        POINTERTORAWDATA:           binary.readUInt32LE(offset + DEBUG_OFFSET_POINTERTORAWDATA)
    }   
}

function readCV_INFO_PDB70FromBinary(binary, offset) {
    return {
        CVSIGNATURE:                binary.readUInt32BE(offset + DEBUG_CODEVIEW_PDB7_OFFSET_CVSIGNATURE),
        GUID:                       binary.readUIntLE(offset + DEBUG_CODEVIEW_PDB7_OFFSET_GUID, 16),
        AGE:                        binary.readUInt32LE(offset + DEBUG_CODEVIEW_PDB7_OFFSET_AGE)
    }
}