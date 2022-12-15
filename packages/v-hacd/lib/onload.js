Module['CONTACT_ADDED_CALLBACK_SIGNATURE'] = 'iiiiiiii';
Module['CONTACT_DESTROYED_CALLBACK_SIGNATURE'] = 'ii';
Module['CONTACT_PROCESSED_CALLBACK_SIGNATURE'] = 'iiii';
Module['INTERNAL_TICK_CALLBACK_SIGNATURE'] = 'vif';

// EM_ASM({ Module.wasmTable = wasmTable; });

// Reassign global VHACD to the loaded module:
// console.log('Module:', Module);
console.log('VHACD Module', Module, this);
if (typeof this !== 'undefined' && !this['VHACD']) {
    this['VHACD'] = Module;
}
