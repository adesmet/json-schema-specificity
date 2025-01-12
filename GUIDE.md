The end goal is to create a javascript function that checks if one JSON schema (hereafter named "extension") is more specific than another (hereafter named "original") - meaning that any JSON file that would be validated by the extension, would also be validated by the original.

The function should take the original and the extension as arguments, and return true or false.

Try to think throroughly about what changes in the extension would be compatible with the original, and which would not. That list will be your guide throughout the implementation.

When you're finished, test thoroughly and exhaustively with many examples. Apply fixes where needed. 