mkdir out
for %%i in (*.svg) do scour "%%i" "out\%%i" --no-line-breaks