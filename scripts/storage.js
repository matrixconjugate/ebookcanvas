function saveHTMLFilesToLocalStorage(htmlFiles) {
    const htmlFilesData = htmlFiles.map(file => ({ name: file.name, content: file.content }));
    localStorage.setItem("htmlFiles", JSON.stringify(htmlFilesData));
}

function loadHTMLFilesFromLocalStorage() {
    const htmlFilesData = JSON.parse(localStorage.getItem("htmlFiles"));
    if (htmlFilesData) {
        const htmlFiles = htmlFilesData.map(file => ({ name: file.name, content: file.content }));
        displayHTMLList(htmlFiles);
    }
}

function saveDrawingsToLocalStorage(htmlFileName) {
    const storedDrawings = JSON.parse(localStorage.getItem("drawings")) || {};
    storedDrawings[htmlFileName] = drawings;
    localStorage.setItem("drawings", JSON.stringify(storedDrawings));
}

function loadDrawingsFromLocalStorage(htmlFileName) {
    const storedDrawings = JSON.parse(localStorage.getItem("drawings"));
    if (storedDrawings && storedDrawings[htmlFileName]) {
        drawings = storedDrawings[htmlFileName];
        redrawCanvas();
    }
}
