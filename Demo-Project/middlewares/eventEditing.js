exports.isEdittable = (event) => {
    console.log(1)
    const now = new Date();
    return !event.editableBy || (event.editingExpiration && event.editingExpiration > now);
};

