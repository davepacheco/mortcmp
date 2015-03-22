## Synopsis

    mortcmp [--term=TERM] [--rate=RATE1[:PERIOD1] ...] [--verbose] 
            --compare --investment=INVRATE ... PRINCIPAL

This tool computes an amortization schedule for a loan of term TERM with
interest rate RATE1 for a the initial period PERIOD1, optional RATE2 for period
PERIOD2, and so on.  TERM and each PERIOD can be specified as a number of months
by default, or with years using a "y" suffix (e.g., "10y"). If --compare is not
specified, a summary of this loan is printed.  With --verbose, the full
amortization schedule is printed.

If --compare is specified, then the command-line options describe two different
loans having the same PRINCIPAL.  The --term and --rate options that precede
--compare describe the first loan.  The remaining --term and --rate options
describe the second loan.  (The loans do not need to have the same term.)  The
amortization schedules for both loans are compared on a month-to-month basis and
a measure of opportunity cost is simulated as follows: whenever one loan's
payment exceeds the other's for a given month, the program simulates depositing
the difference into an account earning INVRATE annually.  (Each loan has a
separate account, and these values are not symmetrical.)  The value of this
account at the end of the loan term is a measure of "partial" opportunity cost
of the other loan.  The difference in these values is a measure of the actual
opportunity cost of each loan.
