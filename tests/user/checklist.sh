#!/bin/sh

# make a checklist matrix from the smoke script.

echo 'FF3 IE6 Sf3 IE8 Op9   Test '
grep 'Scenario: ' smoke.txt | sed -e 's/Scenario: /[ ] [ ] [ ] [ ] [ ] /'

