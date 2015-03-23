# mortcmp: compare mortgage opportunity costs

This is a stab at comparing the opportunity costs of mortgages.  The idea is
that if you're comparing two mortgages (say, a 10/1 ARM vs. a fixed-rate
mortgage), and one has a lower monthly payment, then assume that you invest the
difference in monthly payments and see what happens.

**Disclaimer:** This is just a tool I built to help work this out.  I'm not a
financial professional.  You should probably talk to one if you're interested
in this.


## Printing mortgage details

    mortcmp [--term=TERM] [--rate=RATE1[:PERIOD1] ...] [--verbose] PRINCIPAL

In this form, "mortcmp" computes the monthly payment for a loan of size
PRINCIPAL with term TERM and interest rate RATE1.  For example, for a fixed-rate
30-year loan of $200,000 at 3.25%:

    $ mortcmp --rate=0.0325 200000
    loan details: $200000 paid monthly over 360 months
                              RATE   PAYMENT     P BEFORE      P AFTER
         Months   1 to 360  3.250%  $ 870.41  $ 200000.00  $      1.77

the monthly payment would be $870.41.  ($1.77 is the accumulated error of
calculations.)

You can model an ARM by adding a time period to the first --rate argument and
then adding another rate for the rest of the term.  Here's an ARM at 2% for the
first 10 years and then 3% after that:

    $ mortcmp --rate=0.02:10y --rate=0.03 200000
    loan details: $200000 paid monthly over 360 months
                              RATE   PAYMENT     P BEFORE      P AFTER
         Months   1 to 119  2.000%  $ 739.24  $ 200000.00  $ 146128.21
         Months 121 to 360  3.000%  $ 810.42  $ 146128.21  $      1.11

You can add several rates this way.  All time periods are in months, but you can
specify years with a trailing "y" (as in "10y" above).

With --verbose, you can see the full amortization schedule.  Here's a 15-year
fixed-rate loan:

    $ mortcmp --term=15y --rate=0.0325 --verbose 200000
    loan details: $200000 paid monthly over 180 months
                              RATE   PAYMENT     P BEFORE      P AFTER
         Months   1 to 180  3.250%  $1405.34  $ 200000.00  $     -0.38

    MONTH    P BEFORE     PAYMENT    INTEREST   PRINCIPAL     P AFTER
        1   200000.00     1405.34      541.67      863.67   199136.33
        2   199136.33     1405.34      539.33      866.01   198270.32
        3   198270.32     1405.34      536.98      868.36   197401.96
    ...
      178     4192.91     1405.34       11.36     1393.98     2798.93
      179     2798.93     1405.34        7.58     1397.76     1401.17
      180     1401.17     1405.34        3.79     1401.55       -0.38

## Comparing mortgages

    mortcmp [--term=TERM] [--rate=RATE1[:PERIOD1] ...]
        --compare --investment=INVRATE 
        [--term=TERM] [--rate=RATE1[:PERIOD1] ...]
        [--verbose] PRINCIPAL

To compare two mortgages' opportunity costs, after the options describing the
first loan, add --compare, followed by options describing the second loan.
(The loans do not need to have the same term.) You'll also need to specify the
annual return on the hypothetical investment using the --investment option.

Here's how it works: the amortization schedules for both loans are compared on
a month-to-month basis.  Whenever one loan's payment exceeds the other's for a
given month, the program simulates depositing the difference into an account
earning the INVRATE annually.  (Each loan has a separate account, and these
values are not symmetrical.)  The value of this account at the end of the loan
term is a measure of "partial" opportunity cost of the other loan.  The
difference in these values is a measure of the actual opportunity cost of each
loan.

Here's an example comparing a 10/1 ARM starting at 2% and going up to 5% after
10 years with a fixed-rate 3.75% loan, using a hypothetical investment return
of 10%:

    $ mortcmp --rate=0.0325:10y --rate=0.0825 \
          --compare --rate=0.0375 --investment=0.10 300000
    loan 1 details: $300000 paid monthly over 360 months
                              RATE   PAYMENT     P BEFORE      P AFTER
         Months   1 to 119  3.250%  $1305.62  $ 300000.00  $ 230188.24
         Months 121 to 360  8.250%  $1961.35  $ 230188.24  $      2.90

    loan 2 details: $300000 paid monthly over 360 months
                              RATE   PAYMENT     P BEFORE      P AFTER
         Months   1 to 360  3.750%  $1389.35  $ 300000.00  $     -2.07

    loan 1 total interest paid:  $  327401.30
    loan 1 investment balance:   $  125688.70
    loan 2 total interest paid:  $  200163.93
    loan 2 investment balance:   $  434358.97

    LOAN 1 NET COST (RELATIVE TO LOAN 2)
    interest:                    $  127237.37
    opportunity cost:            $  308670.27
    total:                       $  435907.64

You can use the --verbose option to show exactly what happens each month.  For
this example, the ARM is cheaper by $83 for the first 120 months, during which
that loan's investment grows:

    MONTH   M1 PAY   M2 PAY    M1 DEP     M1 BAL    M2 DEP     M2 BAL
        1  1305.62  1389.35     83.73      83.73      0.00       0.00
        2  1305.62  1389.35     83.73     168.16      0.00       0.00
        3  1305.62  1389.35     83.73     253.29      0.00       0.00
    ...

Around month 120, the fixed-rate loan becomes cheaper for the rest of the term:

      118  1305.62  1389.35     83.73   16703.95      0.00       0.00
      119  1305.62  1389.35     83.73   16926.88      0.00       0.00
      120  1305.62  1389.35     83.73   17151.67      0.00       0.00
      121  1961.35  1389.35      0.00   17294.60    572.00     572.00
      122  1961.35  1389.35      0.00   17438.72    572.00    1148.77
      123  1961.35  1389.35      0.00   17584.05    572.00    1730.34
      124  1961.35  1389.35      0.00   17730.58    572.00    2316.76
    ...
      359  1961.35  1389.35      0.00  124649.95    572.00  430201.96
      360  1961.35  1389.35      0.00  125688.70    572.00  434358.97

By the end, the fixed-rate option results in a lot more money saved.


## Other resources

* [Fixed-rate mortgage amortization schedule calculator](http://www.bankrate.com/calculators/mortgages/amortization-calculator.aspx)
* [ARM amortization schedule calculator](http://www.calcxml.com/calculators/adjustable-rate-mortgage-calculator)
* [Monthly payment formula (Wikipedia)](http://en.wikipedia.org/wiki/Mortgage_calculator#Monthly_payment_formula)
* [Python mortgage amortization calculator](https://github.com/jbmohler/mortgage)

