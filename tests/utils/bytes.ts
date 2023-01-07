// convert a number that fit into u16 and then convert it to a u8 bytes array
export const fromU16NumberToU8Bytes = (u16Number: number) => {
    return new Uint8Array(new Uint16Array([u16Number]).buffer);
};

export const fromU32NumberToU8Bytes = (u32Number: number) => {
    return new Uint8Array(new Uint32Array([u32Number]).buffer);
};
