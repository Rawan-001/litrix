import React, { useState, useEffect } from "react";
import {
  Steps,
  Button,
  Form,
  Input,
  message,
  Modal,
  Select,
  Alert,
  Tooltip,
  Typography,
  Divider,
  Card,
  Spin,
  Space,
} from "antd";
import {
  ArrowLeftOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  GoogleOutlined,
  MailOutlined,
  UserOutlined,
  LockOutlined,
  PhoneOutlined,
  BankOutlined,
  TeamOutlined,
  PartitionOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";

const { Step } = Steps;
const { Option } = Select;
const { Paragraph, Text, Title } = Typography;

export default function SignUpPage() {
  const [authMethod, setAuthMethod] = useState(null);
  const [current, setCurrent] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [scholarVerificationModal, setScholarVerificationModal] =
    useState(false);
  const [verificationError, setVerificationError] = useState("");
  const [scholarIdError, setScholarIdError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isVerifyingScholar, setIsVerifyingScholar] = useState(false);
  const [isCompletingRegistration, setIsCompletingRegistration] =
    useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    personalEmail: "",
    institution: "",
    googleScholarLink: "",
    college: "",
    department: "",
  });

  const navigate = useNavigate();
  const handleBackToHome = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn("Error signing out:", err);
    }
    localStorage.removeItem("isCompletingRegistration");
    setIsCompletingRegistration(false);
    navigate("/");
  };

  useEffect(() => {
    const checkAuthState = async () => {
      try {
        const isCompleting =
          localStorage.getItem("isCompletingRegistration") === "true";
        setIsCompletingRegistration(isCompleting);

        const unsubscribe = auth.onAuthStateChanged(async (user) => {
          if (user) {
            try {
              const userDoc = await getDoc(doc(db, "users", user.uid));

              if (userDoc.exists() && !isCompleting) {
                navigate("/");
                return;
              } else if (!userDoc.exists() && isCompleting) {
                setAuthMethod("google");
                setFormData((prev) => ({
                  ...prev,
                  email: user.email || "",
                  firstName: user.displayName?.split(" ")[0] || "",
                  lastName:
                    user.displayName?.split(" ").slice(1).join(" ") || "",
                }));
                setCurrent(1);
              }
            } catch (error) {
              console.error("Error checking user document:", error);
              message.error("Error checking user status. Please try again.");
            }
          }

          setIsCheckingAuth(false);
        });

        return () => {
          unsubscribe();
        };
      } catch (error) {
        console.error("Auth state checking error:", error);
        setIsCheckingAuth(false);
      }
    };

    checkAuthState();
  }, [navigate]);

  const handleNext = () => {
    if (
      current === 1 &&
      authMethod === "email" &&
      formData.password !== formData.confirmPassword
    ) {
      message.error("Passwords do not match");
      return;
    }
    setCurrent((prev) => prev + 1);
  };

  const handlePrev = () => setCurrent((prev) => prev - 1);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSelectChange = (value, name) => {
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const validateScholarUrl = (url) => {
    if (!url || typeof url !== "string") return null;

    const regex =
      /^https?:\/\/scholar\.google\.com\/citations\?(?:.*&)?user=([a-zA-Z0-9_-]+)(?:&.*)?$/;
    const m = url.trim().match(regex);
    return m ? m[1] : null;
  };

  const verifyScholarDepartment = async (scholarId, college, department) => {
    if (!scholarId || !college || !department) {
      return { valid: false, error: "Missing required information" };
    }

    setIsVerifyingScholar(true);

    try {
      const profileRef = doc(
        db,
        `colleges/${college}/departments/${department}/faculty_members/${scholarId}`
      );

      const profileSnap = await getDoc(profileRef);

      if (profileSnap.exists()) {
        return { valid: true };
      }

  
      const departmentsRef = collection(db, `colleges/${college}/departments`);
      const departmentsSnap = await getDocs(departmentsRef);

      for (const deptDoc of departmentsSnap.docs) {
        const deptId = deptDoc.id;

        if (deptId === department) continue;

        const scholarRef = doc(
          db,
          `colleges/${college}/departments/${deptId}/faculty_members/${scholarId}`
        );
        const scholarSnap = await getDoc(scholarRef);

        if (scholarSnap.exists()) {
          const deptData = deptDoc.data();
          const deptName = deptData.name || deptId;

          return {
            valid: false,
            error: `This researcher belongs to the ${deptName} department. Please select the correct department.`,
            correctDepartment: deptId,
            correctDepartmentName: deptName,
          };
        }
      }


      return { valid: true };
    } catch (error) {
      console.error("Error verifying scholar department:", error);
      return { valid: false, error: `Verification error: ${error.message}` };
    } finally {
      setIsVerifyingScholar(false);
    }
  };

  const handleSignUp = async () => {
    if (loading) return;

    if (
      authMethod === "email" &&
      formData.password !== formData.confirmPassword
    ) {
      message.error("Passwords do not match");
      return;
    }

    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.college ||
      !formData.department ||
      !formData.googleScholarLink
    ) {
      message.error("Please fill in all required fields");
      return;
    }

    const extractedId = validateScholarUrl(formData.googleScholarLink);
    if (!extractedId) {
      setScholarIdError(
        "Invalid Google Scholar profile link. It should look like: https://scholar.google.com/citations?user=XXXXXXXX"
      );
      return;
    }
    setScholarIdError("");

    try {
      setLoading(true);

      if (authMethod === "email") {
        try {
          const methods = await fetchSignInMethodsForEmail(
            auth,
            formData.email
          );
          if (methods.length) {
            message.error("This email is already in use.");
            setLoading(false);
            return;
          }
        } catch (e) {
          message.error(`Error checking email: ${e.message}`);
          setLoading(false);
          return;
        }
      }

      const verificationResult = await verifyScholarDepartment(
        extractedId,
        formData.college,
        formData.department
      );

      if (!verificationResult.valid) {
        setVerificationError(verificationResult.error);
        setScholarVerificationModal(true);
        setLoading(false);
        return;
      }

      const profileRef = doc(
        db,
        `colleges/${formData.college}/departments/${formData.department}/faculty_members/${extractedId}`
      );

      let profileSnap;
      try {
        profileSnap = await getDoc(profileRef);
      } catch (error) {
        console.error("Error checking profile:", error);
        message.error("Error checking faculty profile. Please try again.");
        setLoading(false);
        return;
      }

      if (!profileSnap.exists()) {
        try {
          await setDoc(doc(db, "pending_profiles", extractedId), {
            email: formData.email,
            firstName: formData.firstName,
            lastName: formData.lastName,
            googleScholarLink: formData.googleScholarLink,
            college: formData.college,
            department: formData.department,
            status: "pending",
            createdAt: new Date(),
          });

          localStorage.removeItem("isCompletingRegistration");
          setIsCompletingRegistration(false);

          message.success("Profile pending approval. We will scrape it soon.");
          navigate("/pending-approval");
          return;
        } catch (error) {
          console.error("Error creating pending profile:", error);
          message.error(
            `Failed to submit profile for approval: ${error.message}`
          );
          setLoading(false);
          return;
        }
      }

      let user = auth.currentUser;

      if (authMethod === "email" && !user) {
        try {
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            formData.email,
            formData.password
          );
          user = userCredential.user;
        } catch (error) {
          console.error("Error creating user:", error);
          message.error(`Failed to create account: ${error.message}`);
          setLoading(false);
          return;
        }
      }

      if (!user) {
        message.error(
          "Authentication error: User not found. Please try again."
        );
        setLoading(false);
        return;
      }

      try {
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          scholar_id: extractedId,
          role: "researcher",
          college: formData.college,
          department: formData.department,
          firstName: formData.firstName,
          lastName: formData.lastName,
          personalEmail: formData.personalEmail || "",
          phoneNumber: formData.phoneNumber || "",
          institution: formData.institution,
          googleScholarLink: formData.googleScholarLink,
          authMethod: authMethod,
          isProfileComplete: true,
          createdAt: new Date(),
        });

        localStorage.removeItem("isCompletingRegistration");
        setIsCompletingRegistration(false);

        setIsModalVisible(true);
      } catch (docError) {
        console.error("Error creating user document:", docError);
        message.error(`Failed to create user document: ${docError.message}`);
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error("Error in sign-up:", error);
      message.error(`Error: ${error.message}`);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const resetAuthState = async () => {
    try {
      await signOut(auth);
      setIsCompletingRegistration(false);
      localStorage.removeItem("isCompletingRegistration");
      return true;
    } catch (err) {
      console.error("Error signing out:", err);
      return false;
    }
  };

  const handleGoogleSignUp = async (isInitialStep = false) => {
    if (loading) return;

    setLoading(true);
    try {
      if (isInitialStep) {
        if (auth.currentUser) {
          await resetAuthState();
        }
        localStorage.setItem("isCompletingRegistration", "true");
      }

      if (isCompletingRegistration && auth.currentUser) {
        setCurrent(1);
        setLoading(false);
        return;
      }

      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      if (!result || !result.user) {
        message.error("Failed to authenticate with Google");
        setLoading(false);
        return;
      }

      const user = result.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (userDoc.exists()) {
        localStorage.removeItem("isCompletingRegistration");
        setIsCompletingRegistration(false);
        message.info("Account already exists. Redirecting to homepage...");
        setTimeout(() => navigate("/"), 1500);
        return;
      }

      if (isInitialStep) {
        setAuthMethod("google");
        setFormData((f) => ({
          ...f,
          email: user.email || "",
          firstName: user.displayName?.split(" ")[0] || "",
          lastName: user.displayName?.split(" ").slice(1).join(" ") || "",
        }));
        setCurrent(1);
        setIsCompletingRegistration(true);
      }
    } catch (err) {
      console.error("Google sign-up error:", err);

      if (err.code === "auth/cancelled-popup-request") {
        message.warning(
          "Google popup was closed before completion. Please try again."
        );
      } else if (err.code === "auth/popup-blocked") {
        message.warning(
          "Google popup was blocked. Please allow popups for this site."
        );
      } else {
        message.error(`Google sign-up failed: ${err.message}`);
      }

      if (isInitialStep) {
        localStorage.removeItem("isCompletingRegistration");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChooseEmail = async () => {
    if (loading) return;

    setLoading(true);
    try {
      if (auth.currentUser) {
        await resetAuthState();
      }

      setAuthMethod("email");
      setCurrent(1);
    } catch (error) {
      console.error("Error preparing email signup:", error);
      message.error("Failed to prepare email signup. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const checkEmailExists = async (email) => {
    if (!email || !email.includes("@")) return false;

    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      return methods.length > 0;
    } catch (error) {
      console.error("Error checking email:", error);
      return false;
    }
  };

  const handleConfirm = () => {
    setIsModalVisible(false);

    localStorage.removeItem("isCompletingRegistration");
    setIsCompletingRegistration(false);

    navigate("/", { replace: true });
  };

  const handleDepartmentCorrection = () => {
    setScholarVerificationModal(false);
    setVerificationError("");

  };


  const authMethodStep = {
    title: "Choose Sign-Up Method",
    content: (
      <div style={styles.authMethodContainer}>
        <Title level={3} style={styles.authTitle}>
          Create your profile
        </Title>

        <Card
          style={{
            ...styles.authCard,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
          hoverable={!loading}
          onClick={() => {
            if (loading) return;
            handleGoogleSignUp(true);
          }}
        >
          <div style={styles.authOption}>
            <div style={styles.authIconWrapper}>
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
                style={styles.googleIcon}
              />
            </div>
            <span style={styles.authText}>Continue with Google</span>
          </div>
        </Card>

        <Divider style={styles.divider}>OR</Divider>

        <Card
          style={{
            ...styles.authCard,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
          hoverable={!loading}
          onClick={() => !loading && handleChooseEmail()}
          className="auth-option-card"
        >
          <div style={styles.authOption}>
            <div style={styles.authIconWrapper}>
              <MailOutlined style={styles.authIcon} />
            </div>
            <span style={styles.authText}>Continue with Email</span>
          </div>
        </Card>

        <div style={styles.signInPrompt}>
          <Text style={styles.signInText}>Existing user? </Text>
          <Button
            type="link"
            onClick={() => navigate("/login")}
            style={styles.signInLink}
          >
            Sign in
          </Button>
        </div>
      </div>
    ),
  };

  const accountDetailsStep = {
    title: "Account Details",
    content: (
      <Form layout="vertical">
        <div style={{ ...styles.formHeader, textAlign: "left" }}>
          <UserOutlined style={styles.formHeaderIcon} />
          <Typography.Title level={4} style={styles.formHeaderTitle}>
            Account Information
          </Typography.Title>
        </div>
        <div style={styles.gridContainer}>
          <Form.Item
            label="Email"
            required
            rules={[{ required: true, message: "Please input your email!" }]}
          >
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={async (e) => {
                handleChange(e);
                if (e.target.value && e.target.value.includes("@")) {
                  const exists = await checkEmailExists(e.target.value);
                  if (exists) {
                    message.warning(
                      "This email is already registered. Please sign in instead."
                    );
                  }
                }
              }}
              prefix={<MailOutlined style={styles.inputIcon} />}
              placeholder="Enter your email"
              style={styles.input}
              disabled={loading}
            />
          </Form.Item>
          <Form.Item
            label="Password"
            required
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input.Password
              name="password"
              value={formData.password}
              onChange={handleChange}
              prefix={<LockOutlined style={styles.inputIcon} />}
              placeholder="Enter your password"
              style={styles.input}
              disabled={loading}
            />
          </Form.Item>
        </div>
        <Form.Item
          label="Confirm Password"
          required
          rules={[
            { required: true, message: "Please confirm your password!" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("password") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error("The two passwords do not match!")
                );
              },
            }),
          ]}
        >
          <Input.Password
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            prefix={<LockOutlined style={styles.inputIcon} />}
            placeholder="Confirm your password"
            style={styles.input}
            disabled={loading}
          />
        </Form.Item>
      </Form>
    ),
  };

  const profileInfoStep = {
    title: "Profile Information",
    content: (
      <Form layout="vertical">
        <div style={{ ...styles.formHeader, textAlign: "left" }}>
          <UserOutlined style={styles.formHeaderIcon} />
          <Typography.Title level={4} style={styles.formHeaderTitle}>
            Personal Information
          </Typography.Title>
        </div>

        <div style={styles.gridContainer}>
          <Form.Item
            label="First Name"
            required
            rules={[
              { required: true, message: "Please input your first name!" },
            ]}
          >
            <Input
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              prefix={<UserOutlined style={styles.inputIcon} />}
              placeholder="Enter your first name"
              style={styles.input}
              disabled={loading}
            />
          </Form.Item>
          <Form.Item
            label="Last Name"
            required
            rules={[
              { required: true, message: "Please input your last name!" },
            ]}
          >
            <Input
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              prefix={<UserOutlined style={styles.inputIcon} />}
              placeholder="Enter your last name"
              style={styles.input}
              disabled={loading}
            />
          </Form.Item>
        </div>

        <div style={styles.gridContainer}>
          <Form.Item label="Phone Number">
            <Input
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              prefix={<PhoneOutlined style={styles.inputIcon} />}
              placeholder="Enter your phone number"
              style={styles.input}
              disabled={loading}
            />
          </Form.Item>
          <Form.Item label="Personal Email">
            <Input
              type="email"
              name="personalEmail"
              value={formData.personalEmail}
              onChange={handleChange}
              prefix={<MailOutlined style={styles.inputIcon} />}
              placeholder="Enter your personal email"
              style={styles.input}
              disabled={loading}
            />
          </Form.Item>
        </div>

        <div style={{ ...styles.formHeader, marginTop: 24, textAlign: "left" }}>
          <BankOutlined style={styles.formHeaderIcon} />
          <Typography.Title level={4} style={styles.formHeaderTitle}>
            Academic Information
          </Typography.Title>
        </div>

        <div style={styles.gridContainer}>
          <Form.Item
            label="Institution"
            required
            rules={[
              { required: true, message: "Please select your institution!" },
            ]}
          >
            <Select
              value={formData.institution}
              onChange={(v) => handleSelectChange(v, "institution")}
              placeholder="Select your institution"
              style={styles.select}
              suffixIcon={<BankOutlined style={styles.selectIcon} />}
              disabled={loading}
            >
              <Option value="Al Baha University">Al-Baha University</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="College"
            required
            rules={[{ required: true, message: "Please select your college!" }]}
          >
            <Select
              value={formData.college}
              onChange={(v) => handleSelectChange(v, "college")}
              placeholder="Select your college"
              style={styles.select}
              suffixIcon={<TeamOutlined style={styles.selectIcon} />}
              disabled={loading}
            >
              <Option value="faculty_computing">Faculty of Computing</Option>
              <Option value="faculty_engineering">
                Faculty of Engineering
              </Option>
            </Select>
          </Form.Item>
        </div>

        <Form.Item
          label="Department"
          required
          rules={[
            { required: true, message: "Please select your department!" },
          ]}
        >
          <Select
            value={formData.department}
            onChange={(v) => handleSelectChange(v, "department")}
            placeholder="Select your department"
            style={styles.select}
            suffixIcon={<PartitionOutlined style={styles.selectIcon} />}
            disabled={!formData.college || loading}
          >
            {formData.college === "faculty_computing" && (
              <>
                <Option value="dept_cs">Computer Science</Option>
                <Option value="dept_it">Information Technology</Option>
                <Option value="dept_se">Software Engineering</Option>
                <Option value="dept_sn">Systems and Networks</Option>
              </>
            )}
            {formData.college === "faculty_engineering" && (
              <>
                <Option value="dept_ece">Electrical Engineering</Option>
                <Option value="dept_me">Mechanical Engineering</Option>
              </>
            )}
          </Select>
        </Form.Item>
      </Form>
    ),
  };

  const scholarVerificationStep = {
    title: "Google Scholar Verification",
    content: (
      <Form layout="vertical">
        <div style={{ ...styles.formHeader, textAlign: "left" }}>
          <LinkOutlined style={styles.formHeaderIcon} />
          <Typography.Title level={4} style={styles.formHeaderTitle}>
            Google Scholar Verification
          </Typography.Title>
        </div>

        <Alert
          message="How to Get the Correct Google Scholar Link"
          description={
            <div style={styles.scholarInstructions}>
              <Paragraph>
                <Text strong>Steps:</Text>
              </Paragraph>
              <ol style={styles.instructionsList}>
                <li>
                  Visit{" "}
                  <a
                    href="https://scholar.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.scholarLink}
                  >
                    Google Scholar
                  </a>
                </li>
                <li>Click on "My Profile"</li>
                <li>Copy the URL from your browser</li>
              </ol>
              <Paragraph>
                <Text strong>The link should look like:</Text>
                <div style={styles.urlExample}>
                  https://scholar.google.com/citations?user=XXXXXXXX
                </div>
              </Paragraph>
            </div>
          }
          type="info"
          style={styles.alertBox}
        />

        <Form.Item
          label={
            <span>
              Google Scholar Profile URL{" "}
              <Tooltip title="Provide the URL of your Google Scholar profile page">
                <InfoCircleOutlined style={{ color: "#1890ff" }} />
              </Tooltip>
            </span>
          }
          required
          validateStatus={scholarIdError ? "error" : ""}
          help={scholarIdError}
        >
          <Input
            name="googleScholarLink"
            value={formData.googleScholarLink}
            onChange={(e) => {
              handleChange(e);
              setScholarIdError("");
            }}
            prefix={<LinkOutlined style={styles.inputIcon} />}
            placeholder="Enter your Google Scholar profile URL"
            style={styles.input}
            disabled={loading}
          />
        </Form.Item>
      </Form>
    ),
  };

  const steps = [
    authMethodStep,
    ...(authMethod === "email" ? [accountDetailsStep] : []),
    profileInfoStep,
    scholarVerificationStep,
  ];


  const stepsForProgress = steps.slice(1);

  return (
    <div style={styles.container}>
      {isCheckingAuth ? (
        <div style={styles.loadingContainer}>
          <Spin size="large" />
          <p style={styles.loadingText}>Checking authentication...</p>
        </div>
      ) : (
        <div style={styles.card}>
          <Button
            type="link"
            icon={<ArrowLeftOutlined />}
            onClick={handleBackToHome}
            style={styles.backButton}
            disabled={loading}
          >
            Back to Homepage
          </Button>

          {current > 0 && (
            <Typography.Title level={2} style={styles.pageTitle}>
              Create New Account
            </Typography.Title>
          )}

          {current > 0 && (
            <Steps
              current={
                authMethod === "email" ? current - 1 : current === 1 ? 0 : 1
              }
              style={{ marginBottom: 30, width: "100%" }}
              progressDot
            >
              {stepsForProgress.map((s, idx) => (
                <Step key={`step-${idx}-${s.title}`} title={s.title} />
              ))}
            </Steps>
          )}

          <Spin spinning={loading} tip="Processing...">
            <div style={styles.formContainer}>{steps[current].content}</div>
          </Spin>

          {current > 0 && (
            <div style={styles.buttons}>
              {current > 1 && (
                <Button
                  style={styles.prevButton}
                  onClick={handlePrev}
                  icon={<ArrowLeftOutlined />}
                  disabled={loading}
                >
                  Previous
                </Button>
              )}
              {current < steps.length - 1 && (
                <Button
                  type="primary"
                  onClick={handleNext}
                  style={styles.nextButton}
                  disabled={loading}
                >
                  Next
                </Button>
              )}
              {current === steps.length - 1 && (
                <Button
                  type="primary"
                  onClick={handleSignUp}
                  style={styles.submitButton}
                  disabled={loading}
                >
                  Submit
                </Button>
              )}
            </div>
          )}

          <Modal
            title="Profile Confirmation"
            open={isModalVisible}
            onOk={handleConfirm}
            onCancel={() => setIsModalVisible(false)}
            closable={false}
            maskClosable={false}
          >
            <p>
              <strong>Name:</strong>{" "}
              {`${formData.firstName} ${formData.lastName}`}
            </p>
            <p>
              <strong>Email:</strong> {formData.email}
            </p>
            <p>
              <strong>Phone Number:</strong>{" "}
              {formData.phoneNumber || "Not provided"}
            </p>
            <p>
              <strong>Institution:</strong> {formData.institution}
            </p>
            <p>
              <strong>Google Scholar Link:</strong> {formData.googleScholarLink}
            </p>
          </Modal>
        </div>
      )}
    </div>
  );
}
const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    width: "100%",
    backgroundColor: "#f0f2f5",
    padding: "20px 0",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  card: {
    width: "100%",
    maxWidth: "1000px",
    padding: "40px",
    borderRadius: "12px",
    backgroundColor: "#fff",
    boxShadow: "0 6px 24px rgba(0, 0, 0, 0.12)",
    position: "relative",
    textAlign: "center",
  },
  pageTitle: {
    marginBottom: 30,
    color: "#1890ff",
  },
  backButton: {
    position: "absolute",
    top: 20,
    left: 20,
    fontSize: 16,
    color: "#1890ff",
  },
  gridContainer: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
    width: "100%",
  },
  formContainer: {
    width: "100%",
    maxWidth: 800,
    margin: "0 auto",
  },
  formHeader: {
    display: "flex",
    alignItems: "center",
    marginBottom: 24,
    width: "100%",
  },
  formHeaderIcon: {
    fontSize: 24,
    marginRight: 12,
    color: "#1890ff",
  },
  formHeaderTitle: {
    margin: 0,
  },
  buttons: {
    marginTop: 30,
    display: "flex",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: 800,
    margin: "30px auto 0",
  },
  prevButton: {
    marginRight: 8,
  },
  nextButton: {
    marginLeft: "auto",
  },
  submitButton: {
    marginLeft: "auto",
  },
  alertBox: {
    marginBottom: 24,
  },
  scholarInstructions: {
    padding: 10,
  },
  instructionsList: {
    margin: "10px 0",
    paddingLeft: 20,
  },
  scholarLink: {
    color: "#1890ff",
  },
  urlExample: {
    backgroundColor: "#f5f5f5",
    padding: "8px 12px",
    borderRadius: 4,
    marginTop: 8,
    fontFamily: "monospace",
    display: "inline-block",
  },
  input: {
    width: "100%",
    borderRadius: 6,
  },
  select: {
    width: "100%",
    borderRadius: 6,
  },
  inputIcon: {
    color: "#bfbfbf",
  },
  selectIcon: {
    color: "#bfbfbf",
  },
  authMethodContainer: {
    width: "100%",
    maxWidth: 400,
    margin: "0 auto",
    textAlign: "center",
  },
  authTitle: {
    marginBottom: 32,
    fontWeight: 600,
  },
  authCard: {
    marginBottom: 16,
    cursor: "pointer",
    borderRadius: 8,
  },
  authOption: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px 0",
  },
  authIconWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  authIcon: {
    fontSize: 20,
    color: "#1890ff",
  },
  authText: {
    fontSize: 16,
  },
  divider: {
    margin: "16px 0",
  },
  signInPrompt: {
    marginTop: 32,
  },
};
