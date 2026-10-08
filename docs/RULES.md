# Sliding tic-tac-toe

Two players, **X** and **O**, play on a 3×3 grid. X starts. Turns always alternate. There is never a draw.

## Placement

On your turn, put your mark on any empty cell.

If, after your placement, you have three of your marks in a straight line — a row, a column, or one of the two long diagonals — you win. Lines do not wrap around the edges of the board.

Keep placing until **each player has three marks**. Three cells will still be empty. Then the game switches to sliding. (If someone already won during placement, the game is already over.)

## Sliding

On your turn, choose **one of your marks** and move it **one step** into an empty cell that shares an edge with it: up, down, left, or right. You may not move diagonally, jump, or move the opponent’s mark.

If, after your slide, you have three-in-a-row as above, you win.

## Other ways the game ends

- If it is your turn to slide and **none of your marks can move** one step into an empty neighbour, you lose. The other player wins.
- If your move produces a **position that has already occurred**, you lose. The other player wins.

A **position** is all of: which cells hold X, which hold O, which are empty, whose turn it is, and whether the game is still in the placement phase or already in the sliding phase. Marks of the same player are identical; swapping two X’s does not make a new position.

## What you will not see

The board never fills with nine marks. Play stops as soon as someone has three-in-a-row, cannot move, or repeats a position. Someone always wins.
