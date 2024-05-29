const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let isDrawing = false;
let drawingMode = false;
let eraseMode = false;
let selectingMode = false;
let drawings = [];
let currentHTMLFile = "";
let currentHTMLContent = "";
let offscreenCanvas, offscreenCtx;
const eraserSize = 20; // Fixed size for the eraser
let selectionStart = null;
let selectionRect = null;

function startDrawing(e) {
    if (selectingMode) {
        selectionStart = getCanvasCoordinates(e);
        selectionRect = { x: selectionStart.x, y: selectionStart.y, width: 0, height: 0 };
    } else {
        isDrawing = true;
        const { x, y } = getCanvasCoordinates(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
        if (!eraseMode) {
            const drawing = { id: Date.now(), points: [{ x, y }], color: "red", width: 2 };
            drawings.push(drawing);
        }
    }
}

function draw(e) {
    if (selectingMode && selectionStart) {
        const { x, y } = getCanvasCoordinates(e);
        selectionRect.width = x - selectionStart.x;
        selectionRect.height = y - selectionStart.y;
        redrawCanvas();
        drawSelectionRectangle();
    } else if (isDrawing) {
        const { x, y } = getCanvasCoordinates(e);
        ctx.lineWidth = 2;
        ctx.strokeStyle = eraseMode ? "white" : "red";
        ctx.globalCompositeOperation = eraseMode ? "destination-out" : "source-over";
        ctx.lineCap = "round";
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);

        if (!eraseMode) {
            drawings[drawings.length - 1].points.push({ x, y });
        }
    }
}

function stopDrawing(e) {
    if (selectingMode && selectionRect) {
        highlightDrawingsInSelection();
    } else {
        isDrawing = false;
        ctx.beginPath();
        if (eraseMode) {
            eraseShape(e);
        } else {
            saveDrawingsToLocalStorage(currentHTMLFile);
        }
    }
}

function eraseShape(e) {
    console.log("erasingshape");
    const { x, y } = getCanvasCoordinates(e);
    console.log(e);
    console.log({ x, y });
    console.log(drawings);
    const shapeIndex = drawings.findIndex(drawing =>
        drawing.points.some(point =>
            Math.abs(point.x - x) < eraserSize && Math.abs(point.y - y) < eraserSize
        )
    );
    console.log(shapeIndex);

    if (shapeIndex !== -1) {
        drawings.splice(shapeIndex, 1);
        saveDrawingsToLocalStorage(currentHTMLFile);
        loadHTMLToCanvas(currentHTMLContent, currentHTMLFile)
        loadDrawingsFromLocalStorage(currentHTMLFile);
    }
}

function redrawCanvas() {
    // Redraw all the drawings
    drawings.forEach(drawing => {
        ctx.beginPath();
        ctx.lineWidth = drawing.width;
        ctx.strokeStyle = drawing.color;
        ctx.globalCompositeOperation = "source-over";
        drawing.points.forEach((point, index) => {
            if (index === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        });
        ctx.stroke();
    });
}

function getCanvasCoordinates(event) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}

function drawSelectionRectangle() {
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 2;
    ctx.strokeRect(selectionRect.x, selectionRect.y, selectionRect.width, selectionRect.height);
}

function highlightDrawingsInSelection() {
    const selectedDrawings = drawings.filter(drawing =>
        drawing.points.some(point =>
            point.x >= selectionRect.x && point.x <= selectionRect.x + selectionRect.width &&
            point.y >= selectionRect.y && point.y <= selectionRect.y + selectionRect.height
        )
    );

    selectedDrawings.forEach(drawing => {
        drawing.points.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI, false);
            ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
            ctx.fill();
        });
    });

    // Provide option to delete selected drawings
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete Selected Drawings';
    deleteButton.style.position = 'absolute';
    deleteButton.style.top = `${canvas.offsetTop + selectionRect.y + selectionRect.height}px`;
    deleteButton.style.left = `${canvas.offsetLeft + selectionRect.x}px`;
    deleteButton.addEventListener('click', function() {
        deleteSelectedDrawings(selectedDrawings);
        document.body.removeChild(deleteButton);
    });

    document.body.appendChild(deleteButton);
}

function deleteSelectedDrawings(selectedDrawings) {
    drawings = drawings.filter(drawing => !selectedDrawings.includes(drawing));
    saveDrawingsToLocalStorage(currentHTMLFile);
    loadHTMLToCanvas(currentHTMLContent, currentHTMLFile)
    loadDrawingsFromLocalStorage(currentHTMLFile);
}

// Display the eraser cursor
canvas.addEventListener("mousemove", function(e) {
    if (eraseMode) {
        const { x, y } = getCanvasCoordinates(e);
        // Create a temporary eraser cursor
        const eraserCursor = document.createElement("div");
        eraserCursor.style.position = "absolute";
        eraserCursor.style.left = `${e.clientX - eraserSize / 2}px`;
        eraserCursor.style.top = `${e.clientY - eraserSize / 2}px`;
        eraserCursor.style.width = `${eraserSize}px`;
        eraserCursor.style.height = `${eraserSize}px`;
        eraserCursor.style.border = "1px solid red";
        eraserCursor.style.borderRadius = "50%";
        eraserCursor.style.pointerEvents = "none"; // So it doesn't interfere with other events
        eraserCursor.classList.add("eraser-cursor");

        document.body.appendChild(eraserCursor);

        // Remove the temporary eraser cursor after a short delay
        setTimeout(() => {
            document.body.removeChild(eraserCursor);
        }, 30); // Adjust the delay as needed
    }
});

canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mouseout", stopDrawing);
