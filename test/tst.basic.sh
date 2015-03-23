#!/bin/bash

#
# Run "mortcmp" with a bunch of examples hand-checked against other amortization
# calculators.
#

function runtest
{
	echo "test case: mortcmp $@"
	echo "--------------------------------"
	if ! $mortcmp "$@"; then
		echo "FAILED"
		exit 1
	fi
	echo "--------------------------------"
}

origin="$(dirname "${BASH_SOURCE[0]}")"
mortcmp="$origin/../bin/mortcmp"

echo "Simple invocation"
runtest --rate=0.0375 300000

echo "Same, specifying 30-years explicitly."
runtest --term=30y --rate=0.0375 300000

echo "Try specifying 15 years explicitly."
runtest --term=15y --rate=0.0385 300000

echo "Try specifying it in months, too."
runtest --term=180 --rate=0.0385 300000

echo "Verbose mode"
runtest --rate=0.0375 --verbose 300000

echo "ARM"
runtest --rate=0.0275:10y --rate=0.03:5y --rate=0.0525 300000

echo "ARM in verbose mode"
runtest --rate=0.0275:10y --rate=0.03:5y --rate=0.0525 --verbose 300000

echo "Compare a fixed-rate with an ARM"
runtest --rate=0.0275:10y --rate=0.06 --compare --rate=0.0325 \
    --investment=0.08 300000

echo "Same, in verbose mode"
runtest --rate=0.0275:10y --rate=0.06 --compare --rate=0.0325 \
    --investment=0.08 --verbose 300000
