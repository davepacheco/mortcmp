/*
 * lib/mortgage-fixed.js: Represents a fixed-rate mortgage with the given
 * principal (in dollars), term (in months), and interest rate.  This is a
 * private interface used to implement the more general Mortgage class.
 */
var mod_assertplus = require('assert-plus');

module.exports = FixedRateMortgage;

/*
 * See above.  There's no friendly validation because this is a private
 * interface.
 */
function FixedRateMortgage(principal, term, rate)
{
	var mrate, p, d, i;
	var payment, pleft, ipaid, ppaid;

	mod_assertplus.number(principal, 'principal');
	mod_assertplus.number(term, 'term');
	mod_assertplus.number(rate, 'rate');

	this.l_principal = principal;
	this.l_term = term;
	this.l_rate = rate;

	mrate = rate / 12;
	this.l_mrate = mrate;

	/*
	 * This calculation for the monthly payment comes from
	 * http://en.wikipedia.org/wiki/Mortgage_calculator
	 */
	p = Math.pow(1 + mrate, -term);
	d = 1 - p;
	payment = Math.round(100 * mrate * principal / d) / 100;
	this.l_payment = payment;

	/*
	 * Compute the amortization schedule.
	 */
	pleft = principal;
	this.l_schedule = new Array(term);
	for (i = 0; i < term; i++) {
		ipaid = Math.round(100 * mrate * pleft) / 100;
		ppaid = payment - ipaid;
		/*
		 * This object is exposed as an interface by the parent Mortgage
		 * class.
		 */
		this.l_schedule[i] = {
		    'total': payment,		/* total payment */
		    'interest': ipaid,		/* interest part */
		    'principal': ppaid,		/* principal part */
		    'mrate': this.l_mrate,	/* monthly interest rate */
		    'pbefore': pleft,		/* principal before payment */
		    'pafter': pleft - ppaid	/* principal after payment */
		};
		pleft -= ppaid;
	}

	mod_assertplus.ok(Math.abs(this.l_schedule[term - 1].pafter) /
	    principal < 0.01);
}

/*
 * Return the monthly payment amount.
 */
FixedRateMortgage.prototype.payment = function ()
{
	return (this.l_payment);
};

/*
 * Return the unpaid principal after month "i".
 */
FixedRateMortgage.prototype.principalLeftAfterMonth = function (i)
{
	mod_assertplus.ok(i >= 0);
	mod_assertplus.ok(i <= this.l_term);
	if (i === 0)
		return (this.l_principal);
	return (this.l_schedule[i - 1].pafter);
};
