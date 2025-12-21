import React from 'react';
import {
  Text,
  Title,
  Container,
  Group,
  Paper,
  SimpleGrid,
  ThemeIcon,
  Accordion,
  Timeline,
  Image,
} from '@mantine/core';
import {
  IconMicroscope,
  IconBrain,
  IconHeartHandshake,
  IconShieldLock,
  IconCalendarStats,
  IconCertificate,
} from '@tabler/icons-react';
import { motion, useAnimation, useInView } from 'framer-motion';
import { useEffect } from 'react';

const MotionSimpleGrid = motion(SimpleGrid);
const MotionTitle = motion(Title);
const MotionText = motion(Text);
const MotionGroup = motion(Group);
const MotionImage = motion(Image);

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

const staggerChildren = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const cardAnimation = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 15,
      stiffness: 200
    }
  },
  hover: {
    y: -10,
    transition: { duration: 0.3 }
  }
};

const heroAnimation = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.8,
      staggerChildren: 0.3
    }
  }
};

const heroTextAnimation = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

const AnimatedSection = ({ children, className, delay = 0 }) => {
  const controls = useAnimation();
  const ref = React.useRef(null);
  const inView = useInView(ref, { once: true, threshold: 0.2 });

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: { opacity: 0, y: 50 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.8,
            ease: "easeOut",
            delay
          }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const About = () => {
  //  const team = [
  //   {
  //     name: "David Daniels",
  //     title: "Chief Medical Officer",
  //     image: "/team-david.jpg",
  //     fallback: "https://via.placeholder.com/200/teal/ffffff?text=SC",
  //     bio: "Board-certified dermatologist with 15+ years of clinical experience and a passion for technology's role in healthcare."
  //   },
  //   {
  //     name: "Paarth Mahadik",
  //     title: "Lead ML Engineer",
  //     image: "/team-paarth2.jpg",
  //     fallback: "https://via.placeholder.com/200/teal/ffffff?text=MR",
  //     bio: "Worked on training and optimizing the machine learning model that powers our skin analysis platform."
  //   },
  //   {
  //     name: "Mahadev Balla",
  //     title: "Full Stack Developer",
  //     image: "/team-mahadev.jpg",
  //     fallback: "https://via.placeholder.com/200/teal/ffffff?text=AP",
  //     bio: "Developed the frontend and backend infrastructure of this platform."
  //   },
  //   {
  //     name: "Vedaant Mahale",
  //     title: "Product Manager",
  //     image: "/team-vedaant2.jpg",
  //     fallback: "https://via.placeholder.com/200/teal/ffffff?text=DK",
  //     bio: "Former healthcare product lead with experience designing intuitive medical technology interfaces."
  //   },
  // ];

  const values = [
    {
      icon: IconMicroscope,
      title: 'Innovation First',
      description: 'We leverage cutting-edge technology to create seamless booking experiences that save time and reduce scheduling friction.',
    },
    {
      icon: IconBrain,
      title: 'Continuous Improvement',
      description: 'Our platform evolves based on user feedback and emerging needs in appointment management systems.',
    },
    {
      icon: IconHeartHandshake,
      title: 'User-Centered Design',
      description: 'We design every feature with both customers and service providers in mind, ensuring ease of use for all.',
    },
    {
      icon: IconShieldLock,
      title: 'Reliability & Security',
      description: 'We maintain strict security standards and ensure your booking data is always protected and accessible.',
    },
  ];

  const faqs = [
    {
      question: "How does the appointment booking system work?",
      answer: "Our platform allows you to browse available services, view real-time availability of providers/resources, select your preferred time slot, and book instantly. The system automatically manages capacity and prevents double bookings."
    },
    {
      question: "Is my booking information secure?",
      answer: "Yes, we take your privacy seriously. All booking data is encrypted and stored securely. We comply with industry-standard security protocols. Your information is never shared with third parties without your consent."
    },
    {
      question: "Can I cancel or reschedule my appointment?",
      answer: "Yes, you can cancel or reschedule appointments based on the cancellation policy set by the service provider. Simply go to your booking confirmation page or profile to manage your appointments. Note that advance payments may have specific refund policies."
    },
    {
      question: "What types of appointments can I book?",
      answer: "The system supports various appointment types including user-based appointments (with specific service providers) and resource-based appointments (like equipment, rooms, or facilities). Each service has its own duration, capacity, and booking rules."
    },
    {
      question: "Will I receive confirmation after booking?",
      answer: "Absolutely! You'll receive instant confirmation after booking, including appointment details, date, time, location, and any additional information. You can also add appointments to your Google Calendar or Outlook calendar directly from the confirmation page."
    },
  ];

  return (
    <motion.div
      className="min-h-screen mt-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Hero Section */}
      <motion.div
        className="bg-gradient-to-r from-teal-600 to-teal-800 text-white py-24 rounded-2xl mx-2 px-4"
        variants={heroAnimation}
        initial="hidden"
        animate="visible"
      >
        <Container size="lg">
          <motion.div className="max-w-3xl flex-col justify-center">
            <MotionTitle
              className="text-4xl md:text-5xl font-bold mb-6"
              variants={heroTextAnimation}
            >
              Our Mission: Simplifying Appointment Scheduling
            </MotionTitle>
            <MotionText
              className="text-xl text-white/90 mb-8 leading-relaxed my-2"
              variants={heroTextAnimation}
            >
              We're building intelligent scheduling solutions that make appointment booking seamless for everyone. From real-time availability to automated management, we help businesses and customers connect effortlessly.
            </MotionText>
            <MotionGroup
              className='mt-2'
              variants={heroTextAnimation}
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <ThemeIcon
                  color='orange'
                  size={60}
                  radius="md"
                  className="bg-white/20 backdrop-blur-sm !bg-gradient-to-r !from-red-500 !to-orange-500 !text-white !font-semibold !shadow-lg !shadow-red-400/50 !transform !transition-all !duration-300 hover:!bg-gradient-to-r hover:!from-orange-500 hover:!to-red-500 
    active:!scale-95 active:!shadow-orange-600/50 focus:!outline-none focus:!ring-2 focus:!ring-red-500 focus:!ring-offset-2 my-2"
                >
                  <IconCertificate size={30} className="text-white" />
                </ThemeIcon>
              </motion.div>
              <div>
                <Text fw={700} className="text-white">Enterprise Ready</Text>
                <Text className="text-white/80">99.9% uptime with real-time availability sync</Text>
              </div>
            </MotionGroup>
          </motion.div>
        </Container>
      </motion.div>

      {/* Our Story Section */}
      <AnimatedSection className="py-20">
        <Container size="lg">
          <MotionSimpleGrid
            cols={{ base: 1, md: 2 }}
            spacing={50}
            variants={staggerChildren}
          >
            <motion.div variants={fadeIn}>
              <Title order={2} className="text-teal-800 mb-6">
                Our Story
              </Title>
              <Text className="text-gray-600 mb-4 leading-relaxed">
                Founded in 2022 by a team of software engineers and scheduling experts, our platform was born from a shared frustration: managing appointments shouldn't be complicated.
              </Text>
              <Text className="text-gray-600 mb-4 leading-relaxed">
                After experiencing countless scheduling conflicts and missed appointments in various industries, we decided to build a solution that puts both service providers and customers in control.
              </Text>
              <Text className="text-gray-600 mb-6 leading-relaxed">
                Today, our technology powers thousands of bookings daily, helping businesses streamline their operations and customers book appointments with ease.
              </Text>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
              >
                <Timeline className='mt-4' color="orange" radius="md" active={3} bulletSize={28} lineWidth={3}>
                  <Timeline.Item bullet={<IconCalendarStats size={12} />} title="2022">
                    <Text size="sm" className="text-gray-600">
                      Company founded, initial platform development begins
                    </Text>
                  </Timeline.Item>

                  <Timeline.Item bullet={<IconCalendarStats size={12} />} title="2023">
                    <Text size="sm" className="text-gray-600">
                      Beta launch with real-time availability and booking management
                    </Text>
                  </Timeline.Item>

                  <Timeline.Item bullet={<IconCalendarStats size={12} />} title="2024">
                    <Text size="sm" className="text-gray-600">
                      Full platform release, capacity management features added
                    </Text>
                  </Timeline.Item>

                  <Timeline.Item bullet={<IconCalendarStats size={12} />} title="2025">
                    <Text size="sm" className="text-gray-600">
                      Payment integration, AI booking assistant launched
                    </Text>
                  </Timeline.Item>
                </Timeline>
              </motion.div>
            </motion.div>

            <motion.div
              className="flex items-center"
              variants={fadeIn}
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="rounded-2xl overflow-hidden shadow-xl"
                initial={{ opacity: 0, scale: 0.8, rotateY: 15 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                transition={{
                  duration: 0.7,
                  delay: 0.3,
                  type: "spring",
                  stiffness: 100
                }}
              >
                <MotionImage
                  src="/about-team.jpg"
                  alt="Our team of developers and scheduling experts"
                  className="w-full h-auto"
                  fallbackSrc="https://via.placeholder.com/600x400/teal/ffffff?text=OurTeam"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.5 }}
                />
              </motion.div>
            </motion.div>
          </MotionSimpleGrid>
        </Container>
      </AnimatedSection>

      {/* Our Values */}
      <AnimatedSection className="bg-gray-50 py-20">
        <Container size="lg">
          <MotionTitle
            order={2}
            className="text-teal-800 text-center mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Our Values
          </MotionTitle>
          <MotionText
            className="text-gray-600 text-center w-full mx-auto mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            These core principles guide everything we do, from how we develop our technology to how we interact with users.
          </MotionText>

          <motion.div
            variants={staggerChildren}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl" className='mt-4'>
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  variants={cardAnimation}
                  whileHover="hover"
                  custom={index}
                >
                  <Paper
                    withBorder
                    p="xl"
                    radius="md"
                    className="hover:shadow-lg transition-shadow border-teal-50 flex"
                  >
                    <motion.div
                      whileHover={{ scale: 1.02, rotate: 1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ThemeIcon
                        color='orange'
                        size={60}
                        radius="md"
                        className="mb-4 !bg-gradient-to-r !from-red-500 !to-orange-500 !text-white !font-semibold !shadow-lg !shadow-red-400/50 !transform !transition-all !duration-300 hover:!bg-gradient-to-r hover:!from-orange-500 hover:!to-red-500 
          active:!scale-95 active:!shadow-orange-600/50 focus:!outline-none focus:!ring-2 focus:!ring-red-500 focus:!ring-offset-2 bg-teal-100 mr-4 flex-shrink-0"
                      >
                        <value.icon size={26} stroke={1.5} />
                      </ThemeIcon>
                    </motion.div>
                    <div>
                      <Title order={4} className="mb-2 text-teal-800">
                        {value.title}
                      </Title>
                      <Text className="text-gray-600 leading-relaxed">
                        {value.description}
                      </Text>
                    </div>
                  </Paper>
                </motion.div>
              ))}
            </SimpleGrid>
          </motion.div>
        </Container>
      </AnimatedSection>

      {/* Team Section - COMMENTED OUT */}
      {/*
      <AnimatedSection className="py-20" delay={0.2}>
        <Container size="lg">
          <MotionTitle
            order={2}
            className="text-teal-800 text-center mb-4"
            variants={fadeIn}
          >
            Meet Our Team
          </MotionTitle>
          <MotionText
            className="text-gray-600 text-center w-full mx-auto mb-16"
            variants={fadeIn}
          >
            Our multidisciplinary team brings together expertise in dermatology, artificial intelligence, and healthcare technology.
          </MotionText>

          <motion.div
            variants={staggerChildren}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="xl" className='mt-4'>
              {team.map((member, index) => (
                <motion.div
                  key={member.name}
                  variants={cardAnimation}
                  whileHover="hover"
                  custom={index}
                >
                  <Paper
                    withBorder
                    p="xl"
                    radius="md"
                    className="hover:shadow-lg transition-shadow border-teal-50 text-center flex flex-col justify-between h-full"
                    style={{ minHeight: 420 }}
                  >
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 10 }}
                    >
                      <Avatar
                        src={member.image}
                        alt={member.name}
                        size={120}
                        radius={120}
                        mx="auto"
                        mb={4}
                        className="border-4 border-teal-50"
                        fallback={<IconUserCircle size={80} stroke={1} className="text-teal-700" />}
                        loading="lazy"
                      />
                    </motion.div>
                    <div className="flex-grow">
                      <Title order={4} className="mb-1 text-teal-800">
                        {member.name}
                      </Title>
                      <Text className="text-lavender-700 mb-3 font-medium">
                        {member.title}
                      </Text>
                      <Text className="text-gray-600 leading-relaxed mt-4">
                        {member.bio}
                      </Text>
                    </div>
                  </Paper>
                </motion.div>
              ))}
            </SimpleGrid>
          </motion.div>
        </Container>
      </AnimatedSection>
      */}


      {/* FAQ Section */}
      <AnimatedSection className="bg-gray-50 py-20" delay={0.3}>
        <Container size="lg">
          <MotionTitle
            order={2}
            className="text-teal-800 text-center mb-4"
            variants={fadeIn}
          >
            Frequently Asked Questions
          </MotionTitle>
          <MotionText
            className="text-gray-600 text-center w-full mx-auto mb-16"
            variants={fadeIn}
          >
            Find answers to common questions about our platform, technology, and services.
          </MotionText>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Paper
              withBorder
              radius="md"
              className="border-teal-100 max-w-3xl mx-auto mt-4"
            >
              <Accordion variant="contained">
                {faqs.map((faq, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    viewport={{ once: true }}
                  >
                    <Accordion.Item value={`faq-${index}`}>
                      <Accordion.Control>
                        <Text fw={600} className="text-teal-800">
                          {faq.question}
                        </Text>
                      </Accordion.Control>
                      <Accordion.Panel>
                        <Text className="text-gray-600">
                          {faq.answer}
                        </Text>
                      </Accordion.Panel>
                    </Accordion.Item>
                  </motion.div>
                ))}
              </Accordion>
            </Paper>
          </motion.div>
        </Container>
      </AnimatedSection>
    </motion.div>
  );
};

export default About;