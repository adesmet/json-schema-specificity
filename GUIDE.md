This module contains a javascript function that checks if one JSON schema (hereafter named "extension") is more specific than another (hereafter named "original") - meaning that any JSON file that would be validated by the extension, would also be validated by the original.

The function takes the original and the extension as arguments, and return true or false.