const htmlList = document.getElementById("html-list");

// Load HTML files and drawings from local storage if available
loadHTMLFilesFromLocalStorage();

document.querySelector("#upload-form").addEventListener("submit", function(event) {
    event.preventDefault();
    const fileInput = document.querySelector("#file-input");
    const file = fileInput.files[0];
    if (file && file.type === "application/epub+zip") {
        extractEPUB(file);
        // Clear existing HTML files in local storage
        localStorage.removeItem("htmlFiles");
        localStorage.removeItem("drawings");
    } else {
        alert("Please upload a valid EPUB file.");
    }
});

document.querySelector("#file-input").addEventListener("change", function() {
    const loadButton = document.getElementById("load-button");
    if (this.files && this.files[0]) {
        loadButton.disabled = false;
        loadButton.classList.add("enabled");
    } else {
        loadButton.disabled = true;
        loadButton.classList.remove("enabled");
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const toggleDrawButton = document.querySelector("#toggle-draw");
    const toggleEraseButton = document.querySelector("#toggle-erase");
    const canvas = document.getElementById("canvas");
    let drawingMode = false;
    let eraseMode = false;

    toggleDrawButton.addEventListener("click", function() {
        drawingMode = !drawingMode;
        eraseMode = false;
        toggleDrawButton.classList.toggle('active', drawingMode);
        toggleEraseButton.classList.remove('active');
        canvas.style.cursor = drawingMode ? 'crosshair' : 'default';
    });

    toggleEraseButton.addEventListener("click", function() {
        eraseMode = !eraseMode;
        drawingMode = false;
        toggleEraseButton.classList.toggle('active', eraseMode);
        toggleDrawButton.classList.remove('active');
        canvas.style.cursor = eraseMode ? 'crosshair' : 'default';
    });

    const sidebar = document.getElementById('sidebar');
    const toggleSidebarButton = document.getElementById('toggle-sidebar');

    toggleSidebarButton.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
    });
});

document.querySelector("#toggle-draw").addEventListener("click", function() {
    drawingMode = !drawingMode;
    eraseMode = false;
    this.classList.toggle('active', drawingMode);
    document.querySelector("#toggle-erase").classList.remove('active');
    canvas.style.cursor = drawingMode ? 'crosshair' : 'default';
});

document.querySelector("#toggle-erase").addEventListener("click", function() {
    eraseMode = !eraseMode;
    drawingMode = false;
    this.classList.toggle('active', eraseMode);
    document.querySelector("#toggle-draw").classList.remove('active');
    canvas.style.cursor = eraseMode ? 'crosshair' : 'default';
});


canvas.addEventListener("mousedown", function(e) {
    if (drawingMode || eraseMode) {
        startDrawing(e);
    }
});

canvas.addEventListener("mousemove", function(e) {
    if ((drawingMode || eraseMode) && isDrawing) {
        draw(e);
    }
});

canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mouseout", stopDrawing);

function extractEPUB(file) {
    const zip = new JSZip();
    zip.loadAsync(file).then((zip) => {
        const htmlFiles = [];
        zip.forEach((relativePath, zipEntry) => {
            if (zipEntry.name.endsWith(".html")) {
                zipEntry.async("string").then(content => {
                    htmlFiles.push({ name: zipEntry.name, content });
                    displayHTMLList(htmlFiles);
                    saveHTMLFilesToLocalStorage(htmlFiles);
                    if (htmlFiles.length === 1) {
                        loadHTMLToCanvas(content, zipEntry.name);
                    }
                });
            }
        });
    }).catch((error) => {
        console.error("Error extracting EPUB:", error);
    });
}


function loadHTMLToCanvas(content, fileName) {
    console.log("Loading HTML content");  // Debug log
    const cleanedContent = cleanHTMLContent(content);
    renderHTMLToCanvas(cleanedContent);
    currentHTMLFile = fileName;
    currentHTMLContent = content;
    loadDrawingsFromLocalStorage(fileName);
}

function cleanHTMLContent(content) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');

    // Remove external stylesheet references
    const stylesheets = doc.querySelectorAll('link[rel="stylesheet"]');
    stylesheets.forEach(stylesheet => stylesheet.remove());

    // Remove external scripts
    const scripts = doc.querySelectorAll('script[src]');
    scripts.forEach(script => script.remove());

    // Extract headings, text, and images
    const bodyContent = doc.body;
    const elements = bodyContent.querySelectorAll('h1, h2, h3, h4, h5, h6, p, img');

    const cleanedDoc = document.implementation.createHTMLDocument('');
    const cleanedBody = cleanedDoc.body;

    elements.forEach(element => {
        cleanedBody.appendChild(element.cloneNode(true));
    });

    return cleanedBody.innerHTML;
}

function renderHTMLToCanvas(htmlContent) {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas before redrawing
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.padding = '10px';
    tempDiv.style.width = '80%';
    tempDiv.style.height = 'auto';
    tempDiv.style.zIndex = '-1';
    tempDiv.innerHTML = htmlContent;
    console.log("HTML content to render:", htmlContent);  // Debug log
    document.body.appendChild(tempDiv);

    console.log("Rendering HTML to canvas...");  // Debug log

    html2canvas(tempDiv).then(canvasContent => {
        canvas.width = canvasContent.width;
        canvas.height = canvasContent.height;
        console.log("Canvas size set to:", canvas.width, canvas.height);  // Debug log

        // Create an offscreen canvas and draw the content
        offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = canvasContent.width;
        offscreenCanvas.height = canvasContent.height;
        offscreenCtx = offscreenCanvas.getContext('2d');
        offscreenCtx.drawImage(canvasContent, 0, 0);

        // Draw the offscreen canvas onto the main canvas
        ctx.drawImage(offscreenCanvas, 0, 0);
        console.log("HTML content rendered to canvas successfully");  // Debug log
        redrawCanvas();
        // Clean up temporary div

    }).catch(error => {
        console.error('Error rendering HTML to canvas:', error);
        document.body.removeChild(tempDiv);
    });
}

function saveHTMLFilesToLocalStorage(htmlFiles) {
    localStorage.setItem('htmlFiles', JSON.stringify(htmlFiles));
}

function loadDrawingsFromLocalStorage(fileName) {
    const drawings = JSON.parse(localStorage.getItem('drawings')) || {};
    const drawingData = drawings[fileName];
    if (drawingData) {
        const img = new Image();
        img.src = drawingData;
        img.onload = () => {
            ctx.drawImage(img, 0, 0);
        };
    }
}

function redrawCanvas() {
    const drawingData = currentDrawingData();
    if (drawingData) {
        const img = new Image();
        img.src = drawingData;
        img.onload = () => {
            ctx.drawImage(img, 0, 0);
        };
    }
}

function currentDrawingData() {
    return localStorage.getItem(`drawing_${currentHTMLFile}`);
}


function displayHTMLList(htmlFiles) {
    htmlList.innerHTML = "";
    htmlFiles.forEach((file, index) => {
        const li = document.createElement("li");
        li.textContent = file.name;
        li.addEventListener("click", () => {
            loadHTMLToCanvas(file.content, file.name);
            setActiveListItem(index);
        });
        htmlList.appendChild(li);
    });
}

function setActiveListItem(activeIndex) {
    const listItems = document.querySelectorAll("#html-list li");
    listItems.forEach((item, index) => {
        if (index === activeIndex) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });
}

function loadHTMLFilesFromLocalStorage() {
    const htmlFiles = JSON.parse(localStorage.getItem('htmlFiles')) || [];
    if (htmlFiles.length > 0) {
        displayHTMLList(htmlFiles);
        loadHTMLToCanvas(htmlFiles[0].content, htmlFiles[0].name);
        setActiveListItem(0);
    }
}

