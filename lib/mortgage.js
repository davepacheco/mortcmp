/*
 * lib/mortgage.js: represents either a fixed-rate or adjustable-rate mortgage
 */

var mod_assertplus = require('assert-plus');
var mod_jsprim = require('jsprim');
var VError = require('verror');

var FixedRateMortgage = require('./mortgage-fixed');

/* Public interface */
exports.createMortgage = createMortgage;

/*
 * This is the public interface for working with mortgage amortization
 * schedules.  It supports both fixed-rate and adjustable-rate mortgages.
 * The underlying implementation breaks ARMs into sequential, truncated
 * fixed-rate mortgages.  Arguments:
 *
 *     principal	initial principal (dollars)
 *     (number)
 *
 *     term		term of the mortgage, in months
 *     (positive int)
 *
 *     periods		sequence of periods with a fixed rate.  For fixed-rate
 *     (arry of object) mortgages, this will have one element.  For ARMs, this
 *     			may have more than one element.  Each element is an
 *     			object with properties:
 *
 *     		rate	(number) interest rate for this period
 *
 *     		period	(positive int) duration of this period, in months
 *
 *			The last period's "period" may be null, in which case it
 *			will fill the remaining term of the mortgage.
 *
 * If the input is syntactically invalid (e.g., some fields null, missing, or
 * have bad types), this throws a synchronous programmer error that should not
 * be handled.  If the input is semantically invalid (e.g., the sum of periods
 * does not match the term of the loan), an Error is returned with a descriptive
 * message.
 */
function createMortgage(args)
{
	var margs;
	var termsofar;
	var period, i;

	mod_assertplus.object(args, 'args');
	mod_assertplus.number(args.principal, 'args.principal');
	mod_assertplus.number(args.term, 'args.term');

	margs = {
	    'principal': args.principal,
	    'term': args.term,
	    'periods': []
	};

	termsofar = 0;
	mod_assertplus.arrayOfObject(args.periods, 'args.periods');
	for (i = 0; i < args.periods.length; i++) {
		period = args.periods[i];
		mod_assertplus.number(period.rate,
		    'period ' + (i + 1) + ' rate');
		if (period.period === null) {
			if (i != args.periods.length - 1) {
				return (new VError('only the last rate ' +
				    'period can have unspecified length'));
			}

			margs.periods.push({
			    'rate': period.rate,
			    'period': margs.term - termsofar
			});
			termsofar += margs.term - termsofar;
		} else {
			mod_assertplus.number(period.period,
			    'period ' + (i + 1) + ' period');
			termsofar += period.period;
			if (termsofar > margs.term) {
				return (new VError('rate periods exceed term'));
			}

			margs.periods.push({
			    'rate': period.rate,
			    'period': period.period
			});
		}
	}

	if (termsofar != margs.term) {
		return (new VError('rate periods do not add up to loan term'));
	}

	return (new Mortgage(margs));
}

/*
 * This has the same signature as createMortgage(), except that the optional
 * "period" field has been filled in with the correct value.  (See the comment
 * above).  Input is assumed valid at this point, and the caller has defensively
 * copied it.
 */
function Mortgage(args)
{
	var self = this;

	mod_assertplus.object(args, 'args');
	mod_assertplus.number(args.principal, 'args.principal');
	mod_assertplus.number(args.term, 'args.term');
	mod_assertplus.arrayOfObject(args.periods, 'args.periods');

	this.m_principal = args.principal;	/* initial principal */
	this.m_term = args.term;		/* term of loan (months) */
	this.m_periods = args.periods;		/* see input above */
	this.m_partials = null;			/* partial mortgages */
	this.m_schedule = null;			/* amortization schedule */
	this.m_totinterest = 0;			/* total interest paid */

	this.initSchedule();

	this.m_schedule.forEach(function (p) {
		self.m_totinterest += p.interest;
	});
}

/*
 * Compute the amortization schedule (populating "m_schedule").
 */
Mortgage.prototype.initSchedule = function ()
{
	var pleft, tleft, sched, mortgages;

	pleft = this.m_principal;
	tleft = this.m_term;
	sched = [];
	mortgages = [];

	this.m_periods.forEach(function (p) {
		var m;

		m = new FixedRateMortgage(pleft, tleft, p.rate);
		pleft = m.principalLeftAfterMonth(p.period);
		tleft -= p.period;

		mortgages.push(m);
		sched = sched.concat(m.l_schedule.slice(0, p.period));
	});

	this.m_schedule = sched;
	this.m_partials = mortgages;
	mod_assertplus.ok(tleft === 0);
	mod_assertplus.ok(pleft < 0.01 * this.m_principal);
};

/*
 * Return the initial principal of the loan.
 */
Mortgage.prototype.principal = function ()
{
	return (this.m_principal);
};

/*
 * Return the term of the loan.
 */
Mortgage.prototype.term = function ()
{
	return (this.m_term);
};

/*
 * Return the total interest paid by the end of the loan.
 */
Mortgage.prototype.totalInterest = function ()
{
	return (this.m_totinterest);
};

/*
 * Return the amortization schedule.  This is an array with one element per
 * monthly payment for the term of the loan.  Each element is an object with
 * properties:
 *
 *     total		the total value of this payment
 *
 *     interest		the interest part of the payment
 *
 *     principal	the principal part of the payment
 *
 *     mrate		the monthly interest rate used for this payment
 *     			(This is the loan's interest rate divided by 12.)
 *
 *     pbefore		the total unpaid principal before this payment
 *
 *     pafter		the total unpaid principal after this payment
 *
 * This interface is defined by the FixedRateMortgage helper class.
 */
Mortgage.prototype.schedule = function ()
{
	return (mod_jsprim.deepCopy(this.m_schedule));
};
