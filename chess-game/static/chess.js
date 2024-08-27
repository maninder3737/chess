const board = [
    ["r", "n", "b", "q", "k", "b", "n", "r"],
    ["p", "p", "p", "p", "p", "p", "p", "p"],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["P", "P", "P", "P", "P", "P", "P", "P"],
    ["R", "N", "B", "Q", "K", "B", "N", "R"]
];

let selectedPiece = null;
let turn = "white";
let moveHistory = [];
let castlingRights = { white: { kingSide: true, queenSide: true }, black: { kingSide: true, queenSide: true } };
let enPassantTarget = null;

const boardElement = document.getElementById('chessboard');

// Define Unicode symbols for pieces
const pieceSymbols = {
    'P': '♙', // White Pawn
    'R': '♖', // White Rook
    'N': '♘', // White Knight
    'B': '♗', // White Bishop
    'Q': '♕', // White Queen
    'K': '♔', // White King
    'p': '♟', // Black Pawn
    'r': '♜', // Black Rook
    'n': '♞', // Black Knight
    'b': '♝', // Black Bishop
    'q': '♛', // Black Queen
    'k': '♚'  // Black King
};

function createBoard() {
    boardElement.innerHTML = ''; // Clear previous board
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.className = 'square ' + ((row + col) % 2 === 0 ? 'white' : 'black');
            square.dataset.row = row;
            square.dataset.col = col;

            if (board[row][col]) {
                const piece = document.createElement('div');
                piece.className = 'piece ' + (board[row][col] === board[row][col].toUpperCase() ? 'white' : 'black');
                piece.textContent = pieceSymbols[board[row][col]];
                square.appendChild(piece);
            }

            square.addEventListener('click', onSquareClick);
            boardElement.appendChild(square);
        }
    }
}

// Make pieces draggable
function makePiecesDraggable() {
    const pieces = document.querySelectorAll('.piece');
    pieces.forEach(piece => {
        piece.draggable = true;

        piece.addEventListener('dragstart', (event) => {
            event.dataTransfer.setData('text/plain', event.target.dataset.position);
            event.target.classList.add('dragging');
        });

        piece.addEventListener('dragend', (event) => {
            event.target.classList.remove('dragging');
        });
    });
}

// Allow squares to accept drops
function enableDropOnSquares() {
    const squares = document.querySelectorAll('.square');
    squares.forEach(square => {
        square.addEventListener('dragover', (event) => {
            event.preventDefault(); // Necessary to allow dropping
        });

        square.addEventListener('drop', (event) => {
            event.preventDefault();
            const piecePosition = event.dataTransfer.getData('text/plain');
            const [fromRow, fromCol] = piecePosition.split(',').map(Number);
            const toRow = parseInt(event.currentTarget.dataset.row);
            const toCol = parseInt(event.currentTarget.dataset.col);

            // Update the board and piece position
            movePiece(fromRow, fromCol, toRow, toCol);
        });
    });
}



// Call these functions after creating the board
function setupDragAndDrop() {
    makePiecesDraggable();
    enableDropOnSquares();
}

// Update createBoard to call setupDragAndDrop
function createBoard() {
    boardElement.innerHTML = ''; // Clear previous board
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.className = 'square ' + ((row + col) % 2 === 0 ? 'white' : 'black');
            square.dataset.row = row;
            square.dataset.col = col;

            if (board[row][col]) {
                const piece = document.createElement('div');
                piece.className = 'piece ' + (board[row][col] === board[row][col].toUpperCase() ? 'white' : 'black');
                piece.textContent = pieceSymbols[board[row][col]];
                piece.dataset.position = `${row},${col}`;
                square.appendChild(piece);
            }

            square.addEventListener('click', onSquareClick);
            boardElement.appendChild(square);
        }
    }

    setupDragAndDrop(); // Ensure drag and drop functionality is set up
}

function movePiece(fromRow, fromCol, toRow, toCol) {
    console.log(`Attempting to move from (${fromRow}, ${fromCol}) to (${toRow}, ${toCol})`);

    // Validate the move legality
    if (!isValidMove(fromRow, fromCol, toRow, toCol)) {
        console.log("Move is not valid.");
        return;
    }

    // Temporarily apply the move
    const tempBoard = board.map(row => row.slice()); // Clone the board
    const movedPiece = tempBoard[fromRow][fromCol];
    const capturedPiece = tempBoard[toRow][toCol];
    tempBoard[toRow][toCol] = movedPiece;
    tempBoard[fromRow][fromCol] = '';

    // Function to find the position of the king
    function findKingPosition(color) {
        const king = color === "white" ? "K" : "k";
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (tempBoard[row][col] === king) {
                    return { row, col };
                }
            }
        }
        throw new Error("King not found on board.");
    }

    // Function to check if a position is under attack
    function isUnderAttack(row, col, opponentColor) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = tempBoard[r][c];
                if (piece && isOpponentPiece(r, c, opponentColor)) {
                    const moves = getPossibleMoves(piece, r, c);
                    if (moves.some(move => move.row === row && move.col === col)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    // Function to check if a piece belongs to the opponent
    function isOpponentPiece(row, col, color) {
        const piece = tempBoard[row][col];
        return piece && (color === "white" ? piece.toLowerCase() !== piece : piece.toUpperCase() !== piece);
    }

    // Check if the king of the current turn color is in check
    function isKingInCheck(color) {
        const kingPosition = findKingPosition(color);
        return isUnderAttack(kingPosition.row, kingPosition.col, color === "white" ? "black" : "white");
    }

    // Revert the move if it leaves the king in check
    if (isKingInCheck(turn)) {
        console.log("Move puts king in check. Undoing move.");
        return;
    }

    // Apply the move to the actual board
    board[toRow][toCol] = movedPiece;
    board[fromRow][fromCol] = '';

    // Switch turn
    turn = turn === "white" ? "black" : "white";

    // Update the board display
    createBoard();
    console.log("Move successful. Board updated.");

    // Check for checkmate or stalemate
    function isCheckmate() {
        const kingPosition = findKingPosition(turn);
        return !getPossibleMovesForKing(turn, kingPosition.row, kingPosition.col).length;
    }

    function getPossibleMovesForKing(color, row, col) {
        const moves = [];
        // Implement logic to find all possible moves for the king
        return moves;
    }

    function isStalemate() {
        const kingPosition = findKingPosition(turn);
        const moves = getPossibleMovesForKing(turn, kingPosition.row, kingPosition.col);
        return !moves.length && isKingInCheck(turn);
    }

    if (isCheckmate()) {
        alert(`${turn === "white" ? "Black" : "White"} wins by checkmate!`);
    } else if (isStalemate()) {
        alert("Stalemate! The game is a draw.");
    }
}

// Add the 'moving' class to the piece when a move starts
function startMove(piece) {
    piece.classList.add('moving');
}

// Remove the 'moving' class when the move is complete
function endMove(piece) {
    piece.classList.remove('moving');
}

// Example of adding event listeners to handle moves
document.querySelectorAll('.piece').forEach(piece => {
    piece.addEventListener('mousedown', function() {
        startMove(this);
    });

    piece.addEventListener('mouseup', function() {
        endMove(this);
    });
});



function findKingPosition(color) {
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (board[row][col] === (color === "white" ? "K" : "k")) {
                return { row, col };
            }
        }
    }
    return null; // King not found
}

function isUnderAttack(row, col, opponentColor, tempBoard = board) {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = tempBoard[r][c];
            if (piece && isOpponentPiece(r, c, opponentColor, tempBoard)) {
                const moves = getPossibleMoves(piece, r, c, tempBoard);
                if (moves.some(move => move.row === row && move.col === col)) {
                    return true;
                }
            }
        }
    }
    return false;
}

function isKingInCheck(board, kingPosition, color) {
    // Iterate through all enemy pieces
    for (let piece of board.pieces) {
        if (piece.color !== color) {
            // Check if any enemy piece can attack the king
            if (canAttack(kingPosition, piece)) {
                return true; // King is in check
            }
        }
    }
    return false; // King is not in check
}

function isValidMove(board, move) {
    const { from, to, piece } = move;
    const kingPosition = board.findKing(piece.color);

    // Temporarily execute the move
    const tempBoard = board.copy(); // Make a copy of the board state
    tempBoard.movePiece(from, to);

    // Check if the king is in check after the move
    if (isKingInCheck(tempBoard, kingPosition, piece.color)) {
        return false; // Invalid move, king is in check
    }

    return true; // Valid move
}


function canAttack(kingPosition, piece) {
    // Implement logic to determine if a piece can attack the king
    // This function should consider the piece type and its possible moves
    // Example: Check if a piece's move can reach the king's position
}


function onSquareClick(event) {
    const square = event.currentTarget;
    const row = parseInt(square.dataset.row);
    const col = parseInt(square.dataset.col);

    if (selectedPiece) {
        if (selectedPiece.row === row && selectedPiece.col === col) {
            // Deselect the piece if the same piece is clicked again
            selectedPiece = null;
            document.querySelectorAll('.possible-move').forEach(square => {
                square.classList.remove('possible-move');
            });
        } else if (isValidMove(selectedPiece, row, col)) {
            // Move the piece if the move is valid
            movePiece(selectedPiece, row, col);
            selectedPiece = null;
        } else {
            // Deselect the previous piece and select a new one
            selectedPiece = null;
            document.querySelectorAll('.possible-move').forEach(square => {
                square.classList.remove('possible-move');
            });

            if (board[row][col] && isCorrectTurn(row, col)) {
                selectedPiece = { row, col, piece: board[row][col] };
                highlightPossibleMoves(selectedPiece);
            }
        }
    } else if (board[row][col] && isCorrectTurn(row, col)) {
        // Select a new piece if it’s the correct turn
        selectedPiece = { row, col, piece: board[row][col] };
        highlightPossibleMoves(selectedPiece);
    }
}

function highlightPossibleMoves(selectedPiece) {
    const { row, col, piece } = selectedPiece;
    const moves = getPossibleMoves(piece, row, col);

    moves.forEach(move => {
        const moveSquare = document.querySelector(`.square[data-row="${move.row}"][data-col="${move.col}"]`);
        if (moveSquare) {
            moveSquare.classList.add('possible-move');
        }
    });
}

function getPossibleMoves(piece, row, col) {
    // Implement logic to return an array of possible moves
    // For example, return an array of { row, col } objects
    // This should be based on the type of piece (e.g., rook, knight, etc.)
    // Placeholder implementation:
    return [];
}

function getPossibleMoves(piece, row, col) {
    const moves = [];
    const type = piece.toLowerCase();

    switch (type) {
        case 'p':
            moves.push(...getPawnMoves(row, col));
            break;
        case 'r':
            moves.push(...getRookMoves(row, col));
            break;
        case 'n':
            moves.push(...getKnightMoves(row, col));
            break;
        case 'b':
            moves.push(...getBishopMoves(row, col));
            break;
        case 'q':
            moves.push(...getQueenMoves(row, col));
            break;
        case 'k':
            moves.push(...getKingMoves(row, col));
            break;
    }

    return moves;
}

function getPawnMoves(row, col) {
    const moves = [];
    const direction = board[row][col] === "P" ? -1 : 1; // White moves up, black moves down

    // Normal moves
    if (isWithinBounds(row + direction, col) && board[row + direction][col] === "") {
        moves.push({ row: row + direction, col });
    }
    if (isWithinBounds(row + 2 * direction, col) && row === (board[row][col] === "P" ? 6 : 1) && board[row + 2 * direction][col] === "") {
        moves.push({ row: row + 2 * direction, col });
    }

    // Capture moves
    if (isWithinBounds(row + direction, col + 1) && board[row + direction][col + 1] && isOpponentPiece(row + direction, col + 1)) {
        moves.push({ row: row + direction, col: col + 1 });
    }
    if (isWithinBounds(row + direction, col - 1) && board[row + direction][col - 1] && isOpponentPiece(row + direction, col - 1)) {
        moves.push({ row: row + direction, col: col - 1 });
    }

    // En passant (not fully implemented here)
    // If en passant is a part of your implementation, you need to add those checks

    return moves;
}

function getRookMoves(row, col) {
    const moves = [];
    const directions = [
        { row: 1, col: 0 }, // Down
        { row: -1, col: 0 }, // Up
        { row: 0, col: 1 }, // Right
        { row: 0, col: -1 } // Left
    ];

    directions.forEach(direction => {
        let r = row;
        let c = col;

        while (true) {
            r += direction.row;
            c += direction.col;
            if (!isWithinBounds(r, c)) break;
            if (board[r][c] === "") {
                moves.push({ row: r, col: c });
            } else {
                if (isOpponentPiece(r, c)) {
                    moves.push({ row: r, col: c });
                }
                break;
            }
        }
    });

    return moves;
}

function getKnightMoves(row, col) {
    const moves = [];
    const directions = [
        { row: 2, col: 1 },
        { row: 2, col: -1 },
        { row: -2, col: 1 },
        { row: -2, col: -1 },
        { row: 1, col: 2 },
        { row: 1, col: -2 },
        { row: -1, col: 2 },
        { row: -1, col: -2 }
    ];

    directions.forEach(direction => {
        const r = row + direction.row;
        const c = col + direction.col;
        if (isWithinBounds(r, c) && (board[r][c] === "" || isOpponentPiece(r, c))) {
            moves.push({ row: r, col: c });
        }
    });

    return moves;
}

function getBishopMoves(row, col) {
    const moves = [];
    const directions = [
        { row: 1, col: 1 }, // Down-right
        { row: 1, col: -1 }, // Down-left
        { row: -1, col: 1 }, // Up-right
        { row: -1, col: -1 } // Up-left
    ];

    directions.forEach(direction => {
        let r = row;
        let c = col;

        while (true) {
            r += direction.row;
            c += direction.col;
            if (!isWithinBounds(r, c)) break;
            if (board[r][c] === "") {
                moves.push({ row: r, col: c });
            } else {
                if (isOpponentPiece(r, c)) {
                    moves.push({ row: r, col: c });
                }
                break;
            }
        }
    });

    return moves;
}

function getQueenMoves(row, col) {
    return [...getRookMoves(row, col), ...getBishopMoves(row, col)];
}

function getKingMoves(row, col) {
    const moves = [];
    const directions = [
        { row: 1, col: 0 }, // Down
        { row: -1, col: 0 }, // Up
        { row: 0, col: 1 }, // Right
        { row: 0, col: -1 }, // Left
        { row: 1, col: 1 }, // Down-right
        { row: 1, col: -1 }, // Down-left
        { row: -1, col: 1 }, // Up-right
        { row: -1, col: -1 } // Up-left
    ];

    directions.forEach(direction => {
        const r = row + direction.row;
        const c = col + direction.col;
        if (isWithinBounds(r, c) && (board[r][c] === "" || isOpponentPiece(r, c))) {
            moves.push({ row: r, col: c });
        }
    });

    return moves;
}


function movePiece(piece, newRow, newCol) {
    if (isValidMove(piece, newRow, newCol)) {
        const [oldRow, oldCol] = [piece.row, piece.col];
        const movedPiece = board[oldRow][oldCol];
        const targetPiece = board[newRow][newCol];

        // Handle special moves
        handleSpecialMoves(movedPiece, oldRow, oldCol, newRow, newCol);

        // Handle castling
        if (movedPiece.toUpperCase() === "K" && Math.abs(oldCol - newCol) === 2) {
            handleCastling(oldRow, oldCol, newRow, newCol);
        }

        // Move the piece
        board[newRow][newCol] = movedPiece;
        board[oldRow][oldCol] = "";

        // Update castling rights
        updateCastlingRights(movedPiece, oldRow, oldCol);

        // Add move to history
        moveHistory.push({ piece: movedPiece, from: [oldRow, oldCol], to: [newRow, newCol], captured: targetPiece });

        // Toggle turn
        turn = turn === "white" ? "black" : "white";

        // Reset selection
        selectedPiece = null;

        // Update the board
        createBoard();

        // Check for checkmate or stalemate
        if (isCheckmate()) {
            alert(`${turn === "white" ? "Black" : "White"} wins by checkmate!`);
        } else if (isStalemate()) {
            alert("Stalemate! The game is a draw.");
        }
    }
}

function handleSquareClick(row, col) {
    if (selectedPiece) {
        if (canCastle(selectedPiece.row, selectedPiece.col, row, col)) {
            handleCastling(selectedPiece.row, selectedPiece.col, row, col);
        } else {
            // Handle regular moves or invalid move attempt
        }
        selectedPiece = null;
    } else {
        // Select the piece if it's a king and enable castling
        if (board[row][col] === 'k' || board[row][col] === 'K') {
            selectedPiece = { row, col };
            highlightCastlingMoves(row, col);
        }
    }
}

// Function to remove the king-check class from all squares
function clearCheckHighlights() {
    document.querySelectorAll('.king-check').forEach(function(square) {
        square.classList.remove('king-check');
    });
}

// Function to highlight the king's square in check
function highlightKingInCheck(kingSquare) {
    // Clear existing highlights
    clearCheckHighlights();

    // Add the king-check class to the king's square
    if (kingSquare) {
        kingSquare.classList.add('king-check');
    }
}

// Example usage
// Replace this with your actual logic for determining the king's position
function getKingSquare(color) {
    // Placeholder: Replace with your method to get the king's square
    // For example, you might search for a specific class or ID
    return document.querySelector(`.square.${color}.king`);
}

// Detect if the king is in check and update the UI
function updateCheckStatus() {
    // Example: Check both kings
    const whiteKingSquare = getKingSquare('white');
    const blackKingSquare = getKingSquare('black');

    // Placeholder logic to determine if the king is in check
    // Replace with your actual check detection logic
    if (isInCheck('white')) {
        highlightKingInCheck(whiteKingSquare);
    } else if (isInCheck('black')) {
        highlightKingInCheck(blackKingSquare);
    }
}

// Example function to determine if a king is in check
function isInCheck(color) {
    // Replace this with your actual check detection logic
    return false; // Placeholder
}

// Call updateCheckStatus() at appropriate times, e.g., after a move
updateCheckStatus();


function highlightCastlingMoves(row, col) {
    // Logic to highlight potential castling moves
    const possibleCastling = getPossibleCastlingMoves(row, col);
    possibleCastling.forEach(move => {
        // Highlight move squares
    });
}

function handleCastling(kingRow, kingCol, newKingRow, newKingCol) {
    const isKingSide = newKingCol > kingCol;
    const rookCol = isKingSide ? 7 : 0;
    const rookNewCol = isKingSide ? 5 : 3;

    // Move the king
    board[newKingRow][newKingCol] = board[kingRow][kingCol];
    board[kingRow][kingCol] = "";

    // Move the rook
    board[newKingRow][rookNewCol] = board[kingRow][rookCol];
    board[kingRow][rookCol] = "";

    // Clear highlights and update the board
    clearHighlights();
    createBoard();
}

function clearHighlights() {
    // Clear highlighted squares after the move
}

function canCastle(kingRow, kingCol, newKingRow, newKingCol) {
    // Check if the king and rook have moved
    if (!castlingRights[turn].kingSide && Math.abs(kingCol - newKingCol) === 2) {
        return false;
    }
    if (!castlingRights[turn].queenSide && Math.abs(kingCol - newKingCol) === 2) {
        return false;
    }

    // Check if squares between king and rook are empty
    const isKingSide = newKingCol > kingCol;
    const rookCol = isKingSide ? 7 : 0;
    const rookPath = isKingSide ? [kingCol + 1, kingCol + 2] : [kingCol - 1, kingCol - 2];

    for (const col of rookPath) {
        if (board[kingRow][col] !== "") {
            return false;
        }
    }

    // Check if king is in check or moves through/checks
    // (Implement logic to verify king's safety during castling)

    return true;
}

function updateCastlingRightsAfterCastling() {
    castlingRights[turn].kingSide = false;
    castlingRights[turn].queenSide = false;
}

function isValidMove(piece, newRow, newCol) {
    const [oldRow, oldCol] = [piece.row, piece.col];
    const movedPiece = board[oldRow][oldCol];

    if (!isWithinBounds(newRow, newCol) || (board[newRow][newCol] && isCorrectTurn(newRow, newCol))) {
        return false;
    }

    switch (movedPiece.toLowerCase()) {
        case "p":
            return isValidPawnMove(oldRow, oldCol, newRow, newCol);
        case "r":
            return isValidRookMove(oldRow, oldCol, newRow, newCol);
        case "n":
            return isValidKnightMove(oldRow, oldCol, newRow, newCol);
        case "b":
            return isValidBishopMove(oldRow, oldCol, newRow, newCol);
        case "q":
            return isValidQueenMove(oldRow, oldCol, newRow, newCol);
        case "k":
            return isValidKingMove(oldRow, oldCol, newRow, newCol);
        default:
            return false;
    }
}

function isWithinBounds(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
}

function isValidPawnMove(oldRow, oldCol, newRow, newCol) {
    const direction = board[oldRow][oldCol] === "P" ? -1 : 1;
    const startRow = board[oldRow][oldCol] === "P" ? 6 : 1;

    // Normal move
    if (oldCol === newCol && board[newRow][newCol] === "" && (newRow === oldRow + direction || (oldRow === startRow && newRow === oldRow + 2 * direction))) {
        return true;
    }

    // Capture move
    if (Math.abs(newCol - oldCol) === 1 && newRow === oldRow + direction && board[newRow][newCol] !== "" && isOpponentPiece(newRow, newCol)) {
        return true;
    }

    // En passant
    if (newRow === oldRow + direction && (newCol === oldCol + 1 || newCol === oldCol - 1) && board[newRow][newCol] === "" && enPassantTarget && enPassantTarget.row === newRow && enPassantTarget.col === newCol) {
        return true;
    }

    return false;
}

function isValidRookMove(oldRow, oldCol, newRow, newCol) {
    if (oldRow !== newRow && oldCol !== newCol) {
        return false;
    }
    return isPathClear(oldRow, oldCol, newRow, newCol);
}

function isValidKnightMove(oldRow, oldCol, newRow, newCol) {
    return Math.abs(oldRow - newRow) === 2 && Math.abs(oldCol - newCol) === 1 || Math.abs(oldRow - newRow) === 1 && Math.abs(oldCol - newCol) === 2;
}

function isValidBishopMove(oldRow, oldCol, newRow, newCol) {
    return Math.abs(oldRow - newRow) === Math.abs(oldCol - newCol) && isPathClear(oldRow, oldCol, newRow, newCol);
}

function isValidQueenMove(oldRow, oldCol, newRow, newCol) {
    return isValidRookMove(oldRow, oldCol, newRow, newCol) || isValidBishopMove(oldRow, oldCol, newRow, newCol);
}

function isValidKingMove(oldRow, oldCol, newRow, newCol) {
    return Math.abs(oldRow - newRow) <= 1 && Math.abs(oldCol - newCol) <= 1;
}

function isPathClear(oldRow, oldCol, newRow, newCol) {
    const rowStep = Math.sign(newRow - oldRow);
    const colStep = Math.sign(newCol - oldCol);
    let row = oldRow + rowStep;
    let col = oldCol + colStep;

    while (row !== newRow || col !== newCol) {
        if (board[row][col] !== "") {
            return false;
        }
        row += rowStep;
        col += colStep;
    }
    return true;
}

function handleSpecialMoves(piece, oldRow, oldCol, newRow, newCol) {
    if (piece.toLowerCase() === "p") {
        if (Math.abs(newRow - oldRow) === 2) {
            enPassantTarget = { row: (oldRow + newRow) / 2, col: newCol };
        } else {
            enPassantTarget = null;
        }

        if (newRow === 0 || newRow === 7) {
            const promotionPiece = prompt("Promote your pawn to (Q/R/B/N):");
            board[newRow][newCol] = promotionPiece.toUpperCase();
        }
    } else {
        enPassantTarget = null;
    }
}

function handlePawnPromotion(row, col) {
    const promotionPiece = prompt("Promote your pawn to (Q/R/B/N):").toUpperCase();
    if (["Q", "R", "B", "N"].includes(promotionPiece)) {
        board[row][col] = turn === "white" ? promotionPiece : promotionPiece.toLowerCase();
    }
}

function undoMove() {
    if (moveHistory.length > 0) {
        const lastMove = moveHistory.pop();
        const { piece, from, to, captured } = lastMove;

        board[from[0]][from[1]] = piece;
        board[to[0]][to[1]] = captured;
        turn = turn === "white" ? "black" : "white";

        createBoard();
    }
}

function isCheckmate() {
    const kingPosition = findKingPosition(turn);
    return !getPossibleMovesForKing(turn, kingPosition.row, kingPosition.col).length && isKingInCheck(turn);
}

function isStalemate() {
    const kingPosition = findKingPosition(turn);
    return !getPossibleMovesForKing(turn, kingPosition.row, kingPosition.col).length && !isKingInCheck(turn);
}





function updateCastlingRights(movedPiece, oldRow, oldCol) {
    if (movedPiece.toUpperCase() === "K") {
        castlingRights[turn].kingSide = false;
        castlingRights[turn].queenSide = false;
    }
    if (movedPiece.toUpperCase() === "R") {
        if (oldRow === 7 && oldCol === 0) castlingRights.white.queenSide = false;
        if (oldRow === 7 && oldCol === 7) castlingRights.white.kingSide = false;
        if (oldRow === 0 && oldCol === 0) castlingRights.black.queenSide = false;
        if (oldRow === 0 && oldCol === 7) castlingRights.black.kingSide = false;
    }
}

function isCorrectTurn(row, col) {
    const piece = board[row][col];
    return (turn === "white" && piece === piece.toUpperCase()) || (turn === "black" && piece === piece.toLowerCase());
}

function isOpponentPiece(row, col) {
    const piece = board[row][col];
    return (turn === "white" && piece === piece.toLowerCase()) || (turn === "black" && piece === piece.toUpperCase());
}

function isCheckmate() {
    // Implement checkmate detection
    return false;
}

function isStalemate() {
    // Implement stalemate detection
    return false;
}

createBoard();
