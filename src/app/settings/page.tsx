import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOrgContext } from "@/utils/auth";
import MembersClient from "./members/MembersClient";
import AccountSectionClient from "./AccountSectionClient";
import SecuritySectionClient from "./SecuritySectionClient";
import TeachingDefaultsClient from "./TeachingDefaultsClient";
import {
	addDiscount,
	deleteDiscount,
	saveBillingSettings,
} from "./_actions/billing";
import {
	approveJoinRequest,
	cancelInvitation,
	generateJoinCode,
	inviteMember,
	rejectJoinRequest,
	removeMember,
	updateRole,
} from "./_actions/team";

async function updateOrg(formData: FormData) {
	"use server";
	const ctx = await requireOrgContext();
	if (ctx.role !== "OWNER") return;

	const name = String(formData.get("name") || "").trim();
	if (!name) return;

	await prisma.organisation.update({
		where: { id: ctx.organisationId },
		data: { name },
	});

	redirect("/settings#organisation");
}

export default async function SettingsPage() {
	const ctx = await requireOrgContext();

	const [org, user, team, billingSettings] = await Promise.all([
		prisma.organisation.findUnique({
			where: { id: ctx.organisationId },
			select: { id: true, name: true, slug: true, joinCode: true, joinCodeExpiresAt: true },
		}),
		prisma.user.findUnique({
			where: { id: ctx.userId },
			select: {
				name: true,
				email: true,
				image: true,
				bio: true,
				passwordHash: true,
			},
		}),
		Promise.all([
			prisma.organisationMember.findMany({
				where: { organisationId: ctx.organisationId },
				include: { user: { select: { id: true, name: true, email: true, image: true } } },
				orderBy: { createdAt: "asc" },
			}),
			prisma.invitation.findMany({
				where: {
					organisationId: ctx.organisationId,
					acceptedAt: null,
					expiresAt: { gt: new Date() },
				},
				orderBy: { createdAt: "desc" },
			}),
			prisma.organisationJoinRequest.findMany({
				where: { organisationId: ctx.organisationId, status: "PENDING" },
				include: { user: { select: { id: true, name: true, email: true } } },
				orderBy: { createdAt: "desc" },
			}),
		]),
		prisma.billingSettings.findUnique({
			where: { organisationId: ctx.organisationId },
			include: { discounts: { orderBy: { createdAt: "asc" } } },
		}),
	]);

	if (!org) redirect("/dashboard");
	if (!user) redirect("/signin");

	const isOwner = ctx.role === "OWNER";
	const canBillingEdit = ctx.role === "OWNER" || ctx.role === "ADMIN";
	const defaultTermRate = billingSettings
		? (billingSettings.defaultTermRateCents / 100).toFixed(2)
		: "0.00";

	const [members, pendingInvitations, pendingJoinRequests] = team;

	return (
		<div className="pt-8" style={{ fontFamily: "'Work Sans', sans-serif" }}>
			<div className="mb-6">
				<h1 className="text-2xl font-semibold text-[#3D4756]">Settings</h1>
				<p className="text-sm text-gray-500 mt-1">
					Manage your account, security, workspace, team access, billing, and defaults.
				</p>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
				{/* In-page nav */}
				<nav className="lg:sticky lg:top-6 h-fit">
					<div className="bg-white rounded-2xl shadow-sm p-4">
						<div className="text-xs font-semibold tracking-wide text-gray-500 uppercase mb-3">
							Sections
						</div>
						<ul className="space-y-2 text-sm">
							<li>
								<a className="text-gray-700 hover:text-gray-900" href="#account">
									Account
								</a>
							</li>
							<li>
								<a className="text-gray-700 hover:text-gray-900" href="#security">
									Security
								</a>
							</li>
							<li>
								<a
									className="text-gray-700 hover:text-gray-900"
									href="#organisation"
								>
									Organisation / Workspace
								</a>
							</li>
							<li>
								<a className="text-gray-700 hover:text-gray-900" href="#team">
									Team & Access
								</a>
							</li>
							<li>
								<a className="text-gray-700 hover:text-gray-900" href="#billing">
									Billing & Pricing
								</a>
							</li>
							<li>
								<a className="text-gray-700 hover:text-gray-900" href="#defaults">
									Teaching & App Defaults
								</a>
							</li>
						</ul>
					</div>
				</nav>

				{/* Sections */}
				<div className="space-y-6">
					<section id="account" className="scroll-mt-6">
						<div className="bg-white rounded-2xl shadow-sm p-6">
							<h2 className="text-lg font-medium text-gray-900 mb-4">Account</h2>
							<AccountSectionClient
								initialName={user.name ?? "Unnamed"}
								initialEmail={user.email}
								initialImage={user.image}
								initialBio={(user as any).bio ?? null}
							/>
						</div>
					</section>

					<section id="security" className="scroll-mt-6">
						<div className="bg-white rounded-2xl shadow-sm p-6">
							<h2 className="text-lg font-medium text-gray-900 mb-4">Security</h2>
							<SecuritySectionClient hasPassword={user.passwordHash != null} />
						</div>
					</section>

					<section id="organisation" className="scroll-mt-6">
						<div className="bg-white rounded-2xl shadow-sm p-6">
							<h2 className="text-lg font-medium text-gray-900 mb-4">
								Organisation / Workspace
							</h2>
							<form action={updateOrg} className="space-y-4 max-w-2xl">
								<label className="block">
									<div className="text-sm font-medium text-gray-700">
										Organisation name
									</div>
									<input
										name="name"
										defaultValue={org.name}
										required
										disabled={!isOwner}
										className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#584b53] disabled:bg-gray-50 disabled:text-gray-500"
									/>
								</label>
								<div>
									<div className="text-sm font-medium text-gray-700">Slug</div>
									<div className="mt-1 text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2 border">
										{org.slug}
									</div>
								</div>
								{isOwner && (
									<button
										type="submit"
										className="bg-[#3D4756] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2A3441] transition-colors"
									>
										Save changes
									</button>
								)}
							</form>
						</div>
					</section>

					<section id="team" className="scroll-mt-6">
						<div className="space-y-4">
							<h2 className="text-lg font-medium text-gray-900">Team & Access</h2>
							<MembersClient
								members={members.map((m) => ({
									id: m.id,
									role: m.role,
									userId: m.userId,
									user: m.user,
								}))}
								pendingInvitations={pendingInvitations.map((inv) => ({
									id: inv.id,
									email: inv.email,
									role: inv.role,
									token: inv.token,
									expiresAt: inv.expiresAt.toISOString(),
								}))}
								joinCode={org.joinCode ?? null}
								joinCodeExpiresAt={org.joinCodeExpiresAt?.toISOString() ?? null}
								pendingJoinRequests={pendingJoinRequests.map((r) => ({
									id: r.id,
									userId: r.userId,
									role: r.role,
									createdAt: r.createdAt.toISOString(),
									user: r.user,
								}))}
								currentUserId={ctx.userId}
								currentRole={ctx.role}
								inviteAction={inviteMember}
								removeAction={removeMember}
								updateRoleAction={updateRole}
								cancelInvitationAction={cancelInvitation}
								generateJoinCodeAction={generateJoinCode}
								approveJoinRequestAction={approveJoinRequest}
								rejectJoinRequestAction={rejectJoinRequest}
							/>
						</div>
					</section>

					<section id="billing" className="scroll-mt-6">
						<div className="bg-white rounded-2xl shadow-sm p-6">
							<h2 className="text-lg font-medium text-gray-900 mb-4">
								Billing & Pricing
							</h2>
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
								<div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
									<h3 className="text-base font-medium text-gray-900 mb-4">
										Default Term Rate
									</h3>
									<form action={saveBillingSettings} className="space-y-4">
										<label className="block">
											<div className="text-sm font-medium text-gray-700">
												Rate per term ($)
											</div>
											<input
												name="defaultTermRate"
												type="number"
												step="0.01"
												min="0"
												defaultValue={defaultTermRate}
												disabled={!canBillingEdit}
												className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#584b53] disabled:bg-gray-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
											/>
										</label>
										<label className="block">
											<div className="text-sm font-medium text-gray-700">
												Currency
											</div>
											<select
												name="currency"
												defaultValue={billingSettings?.currency || "AUD"}
												disabled={!canBillingEdit}
												className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#584b53] disabled:bg-gray-50"
											>
												<option value="AUD">AUD - Australian Dollar</option>
												<option value="USD">USD - US Dollar</option>
												<option value="GBP">GBP - British Pound</option>
												<option value="EUR">EUR - Euro</option>
												<option value="NZD">NZD - New Zealand Dollar</option>
											</select>
										</label>
										<label className="block">
											<div className="text-sm font-medium text-gray-700">
												Tax / GST rate (%)
											</div>
											<input
												name="taxRatePercent"
												type="number"
												step="0.01"
												min="0"
												max="100"
												defaultValue={billingSettings?.taxRatePercent ?? 0}
												disabled={!canBillingEdit}
												className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#584b53] disabled:bg-gray-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
											/>
										</label>
										<label className="flex items-center gap-2">
											<input
												name="taxInclusive"
												type="checkbox"
												defaultChecked={billingSettings?.taxInclusive ?? false}
												disabled={!canBillingEdit}
												className="h-4 w-4 rounded border-gray-300 text-[#584b53] focus:ring-[#584b53]"
											/>
											<span className="text-sm text-gray-700">Prices include tax (tax-inclusive)</span>
										</label>
										<label className="block">
											<div className="text-sm font-medium text-gray-700">
												Lesson ledger charges
											</div>
											<select
												name="chargeTiming"
												defaultValue={billingSettings?.chargeTiming ?? "ON_SCHEDULE"}
												disabled={!canBillingEdit}
												className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#584b53] disabled:bg-gray-50"
											>
												<option value="ON_SCHEDULE">When lesson is scheduled</option>
												<option value="ON_COMPLETE">When lesson is marked complete</option>
											</select>
											<p className="mt-1 text-xs text-gray-500">
												Controls when a charge appears on each student&apos;s account ledger.
											</p>
										</label>
										{canBillingEdit && (
											<button
												type="submit"
												className="bg-[#3D4756] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2A3441] transition-colors"
											>
												Save
											</button>
										)}
									</form>
								</div>

								<div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
									<h3 className="text-base font-medium text-gray-900 mb-4">
										Discounts
									</h3>

									{billingSettings?.discounts && billingSettings.discounts.length > 0 ? (
										<div className="space-y-2 mb-4">
											{billingSettings.discounts.map((d) => (
												<div
													key={d.id}
													className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-gray-100"
												>
													<div>
														<span className="text-sm font-medium text-gray-900">
															{d.name}
														</span>
														<span className="text-xs text-gray-500 ml-2">
															{d.type === "PERCENTAGE"
																? `${d.value}%`
																: `$${(d.value / 100).toFixed(2)}`}
														</span>
													</div>
													{canBillingEdit && (
														<form action={deleteDiscount}>
															<input
																type="hidden"
																name="discountId"
																value={d.id}
															/>
															<button
																type="submit"
																className="text-red-500 hover:text-red-700 text-xs"
															>
																Remove
															</button>
														</form>
													)}
												</div>
											))}
										</div>
									) : (
										<p className="text-sm text-gray-500 mb-4">
											No discounts configured yet.
										</p>
									)}

									{canBillingEdit && (
										<form
											action={addDiscount}
											className="space-y-3 pt-3 border-t border-gray-200"
										>
											<input
												name="name"
												required
												placeholder="Discount name (e.g. Sibling Discount)"
												className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#584b53]"
											/>
											<div className="grid grid-cols-2 gap-3">
												<select
													name="type"
													className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#584b53]"
												>
													<option value="PERCENTAGE">Percentage (%)</option>
													<option value="FIXED">Fixed amount ($)</option>
												</select>
												<input
													name="value"
													type="number"
													step="0.01"
													min="0"
													required
													placeholder="Value"
													className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#584b53] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
												/>
											</div>
											<button
												type="submit"
												className="bg-[#3D4756] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2A3441] transition-colors"
											>
												Add discount
											</button>
										</form>
									)}
								</div>
							</div>
						</div>
					</section>

					<section id="defaults" className="scroll-mt-6">
						<div className="bg-white rounded-2xl shadow-sm p-6">
							<h2 className="text-lg font-medium text-gray-900 mb-4">
								Teaching & App Defaults
							</h2>
							<TeachingDefaultsClient />
						</div>
					</section>
				</div>
			</div>
		</div>
	);
}
